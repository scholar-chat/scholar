const axios = require("axios");
const User = require("./models/user");
const Page = require("./models/page");
const Semester = require("./models/semester");

let updateSemesters = async () => {
  let data = await axios.get("https://fireroad.mit.edu/courseupdater/semesters/");
  let sems = data.data;
  // Put new semesters in
  console.log(sems);
  let newSemesters = [];
  await Promise.all(
    sems.map(async (sem) => {
      let existingSem = await Semester.findOne({ identifier: sem.sem });
      if (!existingSem) {
        let newSem = new Semester({
          identifier: sem.sem,
          name: sem.sem.split("-")[0].toUpperCase() + " " + sem.sem.split("-")[1],
          versionNumber: sem.v,
        });
        await newSem.save();
        newSemesters.push(sem.sem);
      }
    })
  );

  for (var i = 0; i < newSemesters.length; i++) {
    let newSemester = newSemesters[i];
  }
};

let addCourse = async (course) => {
  let existingPage = await Page.findOne({ name: course.subject_id });
  if (existingPage) {
    // update course
    //existingPage.pageType = "Class";
    //await existingPage.save();
  } else {
    let newCourse = new Page(
      Object.assign(course, {
        name: course.subject_id,
        pageType: "Class",
        professor: (course.instructors || [])[0] || "",
      })
    );
    //console.log(newCourse);
    await newCourse.save();
  }
};

let nameToOldId = {};

let clearClasses = async () => {
  let keepIds = [];
  let pages = await Page.find({}).select("_id name pageType");

  await Promise.all(
    pages
      .filter((pg) => {
        return pg.pageType !== "Class";
      })
      .map(async (pg) => {
        keepIds.push(pg._id + "");
      })
  );
  await Promise.all(
    pages
      .filter((pg) => {
        return pg.pageType === "Class";
      })
      .map(async (pg) => {
        nameToOldId[pg.name] = pg._id + "";
      })
  );

  console.log("saving " + keepIds.length + " groups");
  let users = await User.find({});
  await Promise.all(
    users.map(async (user) => {
      user.pageIds = user.pageIds.map((id) => {
        if (!((id.pageId && keepIds.includes(id.pageId)) || keepIds.includes(id))) {
          if (typeof id === "string") {
            return {
              pageId: id,
              semester: "CHANGETHISID",
            };
          } else return id;
        } // CHANGE TO id.pageId

        if (typeof id === "string") {
          return {
            pageId: id,
            semester: "All",
          };
        } else return id;
      });
      await user.save();
    })
  );
  await Page.remove({ pageType: "Class" });
};

initialise = async () => {
  console.log("Starting initialization");
  nameToOldId = {};
  await updateSemesters();
  console.log("Updated Semesters");
  await clearClasses();
  console.log("Cleared Classes");
  let data = await axios.get("https://fireroad.mit.edu/courses/all?full=true");
  let courses = data.data;
  for (var i = 0; i < courses.length; i++) {
    await addCourse(courses[i]);
    //await new Promise((resolve) => setTimeout(resolve, 100));
    if (i % 100 == 0) console.log(i);
  }
  console.log("Done adding Classes");

  newIdToOldId = {};
  let pages = await Page.find({}).select("_id name pageType");

  //nameToOldId = {};
  await Promise.all(
    pages.map(async (pg) => {
      if (pg.pageType === "Class") newIdToOldId[pg._id + ""] = nameToOldId[pg.name];
    })
  );
  oldIdToNewId = {};
  for (var key in newIdToOldId) {
    if (newIdToOldId[key]) oldIdToNewId[newIdToOldId[key]] = key;
  }

  let users = await User.find({});
  await Promise.all(
    users.map(async (user) => {
      user.pageIds = user.pageIds
        .map((id) => {
          if (id.semester === "CHANGETHISID") {
            return {
              semester: "fall-2020",
              pageId: oldIdToNewId[id.pageId],
            };
          }
          return id;
        })
        .filter((id) => {
          return id.pageId;
        });
      await user.save();
    })
  );
  console.log("Done editing Users");
  console.log(Object.keys(oldIdToNewId).length);
};

module.exports = {
  initialise,
};