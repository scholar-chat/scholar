import React, { Component } from "react";
import { post } from "../../utilities";
import { Select, Row, Col, List, Modal } from "antd";
import ActivePost from "./ActivePost";
import AddPost from "./AddPost";
import PostListItem from "./PostListItem";
import MySpin from "./MySpin";
import { socket } from "../../client-socket.js";

class ForumTab extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isError: false,
      isLoading: true,
      groupPosts: [],
      activePost: null,
      select: "All",
    };
  }

  /** SOCKET CALLS **/
  addPostSocket = (post) => {
    this.setState({
      groupPosts: [
        {
          post: post,
          comments: [],
        },
        ...this.state.groupPosts,
      ],
    });
  };

  addCommentSocket = (comment) => {
    let groupPosts = this.state.groupPosts;
    let commentedPost = groupPosts.find((onePost) => {
      return onePost.post._id === comment.postId;
    });
    if (!commentedPost) return;
    commentedPost.comments.push(comment);
    if (this.state.activePost.post._id === commentedPost.post._id)
      this.setState({ activePost: commentedPost });
    this.setState({ groupPosts: groupPosts });
  };

  deletePostSocket = (postId) => {
    let updatedGroupPosts = this.state.groupPosts.filter((x) => x.post._id !== postId);

    this.setState({
      groupPosts: updatedGroupPosts,
    });

    // TODO: say post was deleted
    // check if user is currently viewing this post, change it
    if (this.state.activePost.post._id === postId) {
      if (updatedGroupPosts.length > 0) {
        this.setState({
          activePost: updatedGroupPosts[0],
        });
      } else {
        this.setState({
          activePost: null,
        });
      }
    }
  };

  updatePostSocket = (post) => {
    let updatedGroupPosts = this.state.groupPosts.map((x) => {
      if (x.post._id === post._id) {
        // TODO: say post was updated
        // check if user is currently viewing this post, change it
        if (this.state.activePost.post._id === post._id) {
          this.setState({
            activePost: {
              post: post,
              comments: x.comments,
            },
          });
        }
        return {
          post: post,
          comments: x.comments,
        };
      } else {
        return x;
      }
    });

    this.setState({
      groupPosts: updatedGroupPosts,
    });
  };

  /** API Calls **/
  createNewPost = (data) => {
    post("/api/createNewGroupPost", {
      title: data.title,
      text: data.text,
      labels: data.labels,
      pageId: this.props.page._id,
    }).then((ret) => {
      if (!ret.created) return;
      this.addPostSocket(ret.post);
      this.setState({
        activePost: {
          post: ret.post,
          comments: [],
        },
      });
    });
  };

  createNewComment = (data) => {
    post("/api/createNewComment", {
      text: data.text,
      postId: data.postId,
      pageId: this.props.page._id,
    }).then((ret) => {
      if (!ret.created) {
        this.setState({
          isError: true,
        });
      } else {
        this.addCommentSocket(ret.comment);
      }
    });
  };

  deletePost = (data) => {
    post("/api/deleteGroupPost", data).then((ret) => {
      if (!ret.deleted) {
        this.setState({
          isError: true,
        });
      } else {
        this.deletePostSocket(data.postId);
      }
    });
  };

  updatePost = (data) => {
    post("/api/updateGroupPost", data).then((ret) => {
      if (!ret.updated) {
        this.setState({
          isError: true,
        });
      } else {
        this.updatePostSocket(ret.post);
      }
    });
  };

  updateComment = (data) => {
    post("/api/updateComment", data).then((ret) => {
      if (!ret.updated) return;
      let groupPosts = this.state.groupPosts;
      let updatedPost = groupPosts.find((onePost) => {
        return onePost.post._id === ret.comment.postId;
      });
      let updatedComment = updatedPost.comments.find((oneComment) => {
        return oneComment._id === ret.commentId;
      });
      updatedComment = ret.comment;
      this.setState({ groupPosts: groupPosts });
    });
  };

  /** Utility Functions **/
  setActivePost = (post) => {
    this.setState({
      activePost: post,
    });
  };

  setSelectedLabel = (label) => {
    console.log(label);
    this.setState({
      select: label,
    });
  };

  componentDidMount() {
    this.props.clearForumCounter();
    // fix height of div
    document.getElementsByClassName("ant-tabs-content")[0].style.height = "100%";

    post("/api/joinForum", {
      pageId: this.props.page._id,
    }).then((data) => {
      let groupPosts = data.groupPosts || [];
      groupPosts = groupPosts.sort((a, b) => {
        if (a.post.timestamp > b.post.timestamp) return -1;
        return 1;
      });

      let activePost = {
        post: {
          title: `Welcome to the ${this.props.pageName} Forum!`,
          text:
            "Use the forum to schedule PSET sessions / hangouts in the Lounge, ask questions related to your " +
            this.props.page.pageType.toLowerCase() +
            ", or post memes! Please be respectful to one another, and have fun!",
          userId: 0,
          labels: [],
          reacts: [],
        },
        comments: [],
      };

      this.setState({
        isLoading: false,
        groupPosts: groupPosts,
        activePost: activePost,
      });
    });

    let userId = this.props.user.userId;
    socket.on("createNewGroupPost", (data) => {
      if (userId === data.userId) return;
      if (data.pageId !== this.props.page._id) return;
      if (this.state.isLoading) return;
      this.addPostSocket(data.post);
      this.props.incrementForumCounter();
    });
    socket.on("createNewComment", (data) => {
      if (userId === data.userId) return;
      if (data.pageId !== this.props.page._id) return;
      if (this.state.isLoading) return;
      this.addCommentSocket(data.comment);
    });
    socket.on("deleteGroupPost", (data) => {
      if (userId === data.userId) return;
      if (data.pageId !== this.props.page._id) return;
      if (this.state.isLoading) return;
      this.deletePostSocket(data.postId);
    });

    socket.on("updateGroupPost", (data) => {
      if (userId === data.userId) return;
      if (data.pageId !== this.props.page._id) return;
      if (this.state.isLoading) return;
      this.updatePostSocket(data.post);
    });
  }

  render() {
    return (
      <>
        {this.state.isError ? (
          Modal.error({
            title: "Post has been deleted",
            content: (
              <div>
                <p>This post has been deleted, and your action did not go through.</p>
                <p>Hit OK to reload Interstellar!</p>
              </div>
            ),
            onOk() {
              window.location.href = "/";
            },
          })
        ) : (
          <Row style={{ height: "100%" }}>
            <Col style={{ height: "100%" }} span={9}>
              <div
                style={{
                  height: "100%",
                  overflow: "auto",
                }}
              >
                <Select
                  style={{ width: 120, marginBottom: "10px" }}
                  size="small"
                  defaultValue="All"
                  onChange={this.setSelectedLabel}
                >
                  {["All", "General", "Scheduling", "Resources", "Question", "Meme"].map(
                    (label) => (
                      <Option value={label}>{label}</Option>
                    )
                  )}
                </Select>
                <AddPost createNewPost={this.createNewPost} page={this.props.page} />
                {this.state.isLoading ? (
                  <MySpin />
                ) : (
                  <>
                    <List
                      itemLayout="vertical"
                      size="large"
                      dataSource={
                        this.state.select === "All"
                          ? this.state.groupPosts
                          : this.state.groupPosts.filter((groupPost) =>
                              groupPost.post.labels.includes(this.state.select)
                            )
                      }
                      renderItem={(onePost) => {
                        return (
                          <PostListItem
                            isActivePost={
                              this.state.activePost
                                ? onePost.post._id === this.state.activePost.post._id
                                : false
                            }
                            updatePost={this.updatePost}
                            setActivePost={this.setActivePost}
                            groupPost={onePost}
                            user={this.props.user}
                            poster={
                              this.props.users.find((oneUser) => {
                                return oneUser.userId === onePost.post.userId;
                              }) || { userId: "", name: "Former Member" }
                            }
                          />
                        );
                      }}
                    />
                  </>
                )}
              </div>
            </Col>
            <Col style={{ height: "100%" }} span={15}>
              <div
                style={{
                  height: "100%",
                  overflow: "auto",
                }}
              >
                {this.state.activePost !== null && (
                  <ActivePost
                    createNewComment={this.createNewComment}
                    deletePost={this.deletePost}
                    updatePost={this.updatePost}
                    user={this.props.user}
                    activePost={this.state.activePost}
                    users={this.props.users}
                    isPageAdmin={this.props.isPageAdmin}
                  />
                )}
              </div>
            </Col>
          </Row>
        )}
      </>
    );
  }
}

export default ForumTab;
