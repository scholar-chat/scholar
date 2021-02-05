import React, { Component, useState } from "react";
import { List, Modal, Row, Col, Button, Form, Input, DatePicker, Checkbox } from "antd";
import { post } from "../../utilities";

const { TextArea } = Input;

export default function EditProfile(props) {
  const [form] = Form.useForm();
  let onFinish = (fieldsValue) => {

    post("/api/setCurLoc", { curLoc: fieldsValue.curLoc }).then((data) => {
      if (data.setCurLoc) {
        // console.log(data.setCurLoc)
      }
    });

    post("/api/setHometown", { hometown: fieldsValue.hometown }).then((data) => {
      if (data.setHometown) {
        // console.log(data.setHometown)
      }
    });

    // post("/api/setFunFact", { funFact: fieldsValue.funFact }).then((data) => {
    //   if (data.setFunFact) {
    //     console.log(data.setFunFact)
    //   }
    // });

    post("/api/setBio", { bio: fieldsValue.bio }).then((data) => {
      if (data.setBio) {
        // console.log(data.setBio)
      }
    });

    post("/api/setRestaurant", { restaurant: fieldsValue.restaurant }).then((data) => {
      if (data.setRestaurant) {
        // console.log(data.setRestaurant)
      }
    });

    post("/api/setAdvice", { advice: fieldsValue.advice }).then((data) => {
      if (data.setAdvice) {
        // console.log(data.setAdvice)
      }
    });

    form.resetFields();
    props.setProfileModal(false);
    window.location.reload(false);
  };

  const layout = {
    labelCol: { span: 30 },
    wrapperCol: { span: 90 },
  };

  const tailLayout = {
    wrapperCol: { offset: 30, span: 90 },
  };

  return (
    <Modal
      visible={props.profileModal}
      title={"Edit Profile"}
      onCancel={() => {
        form.resetFields();
        props.setProfileModal(false);
      }}
      footer={null}
    >
      <Form {...layout} form={form} name={"Edit Profile"} onFinish={onFinish}
        initialValues={{
          curLoc: props.curLoc,
          hometown: props.hometown,
          bio: props.bio,
          advice: props.advice,
          restaurant: props.restaurant,
        }}
        >
        <Form.Item
          name="curLoc"
          label="Location/Dorm"
          rules={[
            {
              max: 50,
              message: "Location must be at most 50 characters",
            },
          ]}
        >
          <Input name="curLoc"/>
        </Form.Item>

        <Form.Item
          name="hometown"
          label="Hometown"
          rules={[
            {
              max: 50,
              message: "Hometown must be at most 50 characters",
            },
          ]}
        >
          <Input name="hometown"/>
        </Form.Item>

        <Form.Item
          name="bio"
          label="Bio"
          rules={[
            {
              max: 1000,
              message: "Bio must be at most 1000 characters",
            },
          ]}
        >
          <TextArea name="bio" rows={4} />
        </Form.Item>

        <Form.Item
          name="restaurant"
          label="Favorite Restaurant:"
          rules={[
            {
              max: 50,
              message: "Favorite restaurant must be at most 50 characters",
            },
          ]}
        >
          <Input name="restaurant"/>
        </Form.Item>

        <Form.Item
          name="advice"
          label="Piece of Advice:"
          rules={[
            {
              max: 200,
              message: "Advice must be at most 200 characters",
            },
          ]}
        >
          <Input name="advice"/>
        </Form.Item>

        {/* <Form.Item
          name="funFact"
          label="Fun fact:"
          rules={[
            {
              max: 200,
              message: "Fun fact must be at most 200 characters",
            },
          ]}
        >
          <Input />
        </Form.Item> */}
        
        <Form.Item {...tailLayout}>
          <Button key="submit" type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}