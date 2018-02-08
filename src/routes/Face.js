import React from "react";

import { Layout, Menu, Breadcrumb, Icon } from "antd";

import PO from './PO';
import MatTrend from  './MatTrend'

import styles from "./Face.css";


const { SubMenu } = Menu;
const { Header, Content, Sider, Footer } = Layout;

// 所有的页面
const PAGES =  [{
  key: 'po',
  content: PO,
},
{
  key: 'matTrend',
  content: MatTrend,
}]

// 根据 key，取得页面；如果页面不存在，返回 key
function showPage(key) {
  const page = PAGES.find(p=>p.key === key)
  if (page === undefined) {
    return key;
  }

  // tag 必须是大写
  const Content = page.content;
  return <Content />;
}


class Face extends React.Component {
  state = {
    collapsed: false,
    menuKey: ""
  };

  toggle = () => {
    this.setState({
      collapsed: !this.state.collapsed
    });
  };

  onClickMenu = e => {
    console.log(e);
    this.setState({
      menuKey: e.key
    });
  };

  render() {
    return (
      <Layout>
        <Header>
          <div className={styles.logo} />
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={["2"]}
            style={{ lineHeight: "64px" }}
          >
            <Menu.Item key="1">nav 1</Menu.Item>
            <Menu.Item key="2">nav 2</Menu.Item>
            <Menu.Item key="3">nav 3</Menu.Item>
          </Menu>
        </Header>
        <Layout>
          <Sider
            width={200}
            style={{ background: "#fff" }}
            trigger={null}
            collapsible
            collapsed={this.state.collapsed}
          >
            <Menu
              mode="inline"
              defaultSelectedKeys={["1"]}
              defaultOpenKeys={["sub1"]}
              style={{ height: "100%", borderRight: 0 }}
              onClick={this.onClickMenu}
            >
              <SubMenu
                key="sub1"
                title={
                  <span>
                    <Icon type="user" />
                    <span>分析</span>
                  </span>
                }
              >
                <Menu.Item key="po">采购集中度</Menu.Item>
                <Menu.Item key="matTrend">物料延续性</Menu.Item>
                <Menu.Item key="3">option3</Menu.Item>
                <Menu.Item key="4">option4</Menu.Item>
              </SubMenu>
              <SubMenu
                key="sub2"
                title={
                  <span>
                    <Icon type="laptop" /> <span>subnav 2</span>
                  </span>
                }
              >
                <Menu.Item key="5">option5</Menu.Item>
                <Menu.Item key="6">option6</Menu.Item>
                <Menu.Item key="7">option7</Menu.Item>
                <Menu.Item key="8">option8</Menu.Item>
              </SubMenu>
              <SubMenu
                key="sub3"
                title={
                  <span>
                    <Icon type="notification" /> <span> subnav 3 </span>
                  </span>
                }
              >
                <Menu.Item key="9">option9</Menu.Item>
                <Menu.Item key="10">option10</Menu.Item>
                <Menu.Item key="11">option11</Menu.Item>
                <Menu.Item key="12">option12</Menu.Item>
              </SubMenu>
            </Menu>
          </Sider>
          <Layout style={{ padding: "0 8px 8px" }}>
            <Breadcrumb style={{ margin: "8px 0" }}>
              <Breadcrumb.Item>
                <Icon
                  className={styles.trigger}
                  type={this.state.collapsed ? "menu-unfold" : "menu-fold"}
                  onClick={this.toggle}
                />
              </Breadcrumb.Item>
              <Breadcrumb.Item>Home</Breadcrumb.Item>
              <Breadcrumb.Item>List</Breadcrumb.Item>
              <Breadcrumb.Item>App</Breadcrumb.Item>
            </Breadcrumb>
            <Content
              style={{
                background: "#fff",
                padding: 8,
                margin: 0,
                minHeight: 450
              }}
            >
              {showPage(this.state.menuKey)}
            </Content>

            <Footer style={{ textAlign: "center" }}>
              Ant Design ©2016 Created by Ant UED
            </Footer>
          </Layout>
        </Layout>
      </Layout>
    );
  }
}

export default Face;
