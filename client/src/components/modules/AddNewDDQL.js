import React, { Component, useState } from "react";
import { List, Modal, Row, Col, Button, Form, Input, DatePicker, Checkbox } from "antd";
import DueDate from "./DueDate";
import QuickLink from "./QuickLink";
export default function AddNewDDQL(props) {
  const [form] = Form.useForm();
  let text = props.type === "DueDate" ? "Due Date" : "Quicklink";
  let dateConfig = {
    rules: [{ type: "object", required: true, message: "Please select a due date!" }],
  };
  let onFinish = (fieldsValue) => {
    let values = {};
    if (props.type === "DueDate") {
      values = {
        ...fieldsValue,
        dueDate: fieldsValue["dueDate"].format("YYYY-MM-DD HH:mm:ss"),
      };
    } else {
      values = fieldsValue;
    }
    props.createNewDDQL({
      title: values.title,
      objectType: props.type,
      dueDate: values.dueDate,
      url: values.url,
      visibility: values.public ? "Public" : "Only Me",
    });
    form.resetFields();
  };

  const layout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
  };

  const tailLayout = {
    wrapperCol: { offset: 6, span: 18 },
  };

  return (
    <Modal
      visible={props.visible}
      title={"Add New " + text}
      width={700}
      onCancel={() => {
        form.resetFields();
        props.setVisible(false);
      }}
      footer={null}
    >
      <Row>
        <Col span={12}>
          <Form
            {...layout}
            form={form}
            name={"Add New " + text}
            onFinish={onFinish}
            layout="horizontal"
            initialValues={{
              public: false,
            }}
          >
            {text === "Due Date" ? (
              <Form.Item name="dueDate" label="Due Date" {...dateConfig}>
                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
              </Form.Item>
            ) : (
                <></>
              )}

            <Form.Item
              name="title"
              label="Title"
              rules={[
                {
                  required: true,
                  message: "Please enter a title",
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="url"
              label="URL"
              rules={[
                {
                  required: true,
                  message: "Please enter a valid URL",
                },
              ]}
            >
              <Input placeholder={"www.mit.edu"} />
            </Form.Item>
            <Form.Item {...tailLayout} name="public" valuePropName="checked">
              <Checkbox>Public</Checkbox>
            </Form.Item>
            <Form.Item {...tailLayout}>
              <Button key="submit" type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Col>
        <Col span={12}>
          <div style={{ height: "250px", overflow: "auto" }}>
            <List
              dataSource={props.public}
              renderItem={(item) => {
                return props.type === "DueDate" ? (
                  <DueDate
                    dueDate={item}
                    addOrCompleteDDQL={props.addOrCompleteDDQL}
                    added={false}
                    completed={false}
                  />
                ) : (
                    <QuickLink
                      quickLink={item}
                      addOrCompleteDDQL={props.addOrCompleteDDQL}
                      added={false}
                    />
                  );
              }}
            />
          </div>
        </Col>
      </Row>
    </Modal>
  );
}
