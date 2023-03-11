import React from 'react';
import './Login.css';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';

type LoginProps = {
    onFinish: (values: any) => void
}

const Login: React.FC<LoginProps> = ({ onFinish }: LoginProps) => {
    return (
        <Form
            name="login"
            className="login-form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
        >
            <Form.Item
                name="login"
                rules={[{ required: true, message: 'Please input your Login!' }]}
            >
                <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Login" />
            </Form.Item>
            <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input your Password!' }]}
            >
                <Input
                    prefix={<LockOutlined className="site-form-item-icon" />}
                    type="password"
                    placeholder="Password"
                />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" className="login-form-button" block>
                    Log in
                </Button>
            </Form.Item>
        </Form>
    );
};

export default Login;