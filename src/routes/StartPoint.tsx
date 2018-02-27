import * as React from 'react';

import { Breadcrumb, Icon, Layout, Menu, Tabs } from 'antd';

// tslint:disable-next-line:no-submodule-imports
import { ClickParam } from 'antd/lib/menu';

import MatAmtCluster from './MatAmtCluster';
import MatNew from './MatNew';
import MatPriceVar from './MatPriceVar';
import MatTrendLeft from './MatTrendLeft';
import MatTrendRight from './MatTrendRight';

import './StartPoint.css';

const { SubMenu } = Menu;
const TabPane = Tabs.TabPane;

const { Header, Content, Sider, Footer } = Layout;

// 所有页面
const AllPages = {
  matAmtCluster: MatAmtCluster,
  matTrendLeft: MatTrendLeft,
  matTrendRight: MatTrendRight,
  matPriceVar: MatPriceVar,
  matNew: MatNew
};

// TopNav 顶部导航栏
interface TopNavProps {
  collapsed: boolean;
  onClick: () => void;
}
const TopNav = ({ collapsed, onClick }: TopNavProps) => {
  return (
    <Breadcrumb style={{ margin: '8px 0' }}>
      <Breadcrumb.Item>
        <Icon
          className="trigger"
          type={collapsed ? 'menu-unfold' : 'menu-fold'}
          onClick={onClick}
        />
      </Breadcrumb.Item>
      <Breadcrumb.Item>Home</Breadcrumb.Item>
      <Breadcrumb.Item>List</Breadcrumb.Item>
      <Breadcrumb.Item>App</Breadcrumb.Item>
    </Breadcrumb>
  );
};

// Tab 打开的 pane 的数据结构
interface PaneData {
  title: string;
  key: string;
}

// StartPoint 主窗口 ，其中包含：顶部菜单，侧边栏，内容栏
interface StartPointState {
  // 侧边栏是否 收缩；
  collapsed: boolean;

  // 菜单选中的 key
  menuKey: string;

  // 打开的 tab 页签
  panes: PaneData[];
}
class StartPoint extends React.Component<{}, StartPointState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      collapsed: false,
      menuKey: '',

      panes: [] as PaneData[]
    };
  }

  // 根据 key，取得页面；如果页面不存在，返回 key
  private showPage = (key: string) => {
    // tag 必须是大写
    const Page = AllPages[key];
    if (Page === undefined) {
      return <div>{key}</div>;
    } else {
      return <Page />;
    }
  };

  private toggle = () => {
    this.setState({
      collapsed: !this.state.collapsed
    });
  };

  // 点击侧边栏的菜单
  private onClickMenu = (e: ClickParam) => {
    console.log(e);
    const { panes } = this.state;

    const menuKey = e.key;
    // 点击的菜单项，是否已经有 打开的 pane
    const exist = panes.find(p => p.key === menuKey);
    if (exist === undefined) {
      // 没有打开的 pane，那么就新建一个 pane
      panes.push({ title: e.item.props.children, key: e.key });
    }

    this.setState({
      menuKey: e.key,
      panes
    });
  };

  // 点击 tab 页签
  private onPaneChange = (activeKey: string) => {
    this.setState({ menuKey: activeKey });
  };

  // Tab 使用: 新增和删除页签的回调，在 type="editable-card" 时有效
  private onEdit = (targetKey: string, action: string) => {
    console.log(targetKey, action);
    if (action === 'remove') {
      this.remove(targetKey);
    }

    // this[action](targetKey);
  };

  // Tab 使用
  private remove = (targetKey: string) => {
    // 重新计算活动的 pane;
    // 如果关闭了 非当前页签，那么 当前页签保持不变；
    // 如果关闭了 当前页签，那么 显示当前页签 左边 的页签；
    // 如果，新计算出来的当前页签，小于零，那么使它等于零；
    let activeKey = this.state.menuKey;
    let lastIndex = 0;
    this.state.panes.forEach((pane, i) => {
      if (pane.key === targetKey) {
        lastIndex = i - 1;
      }
    });
    lastIndex = lastIndex < 0 ? 0 : lastIndex;

    // 移除关闭的 pane;
    const panes = this.state.panes.filter(pane => pane.key !== targetKey);

    // 关闭的是 当前页面，所以，需要计算下一个页面；
    // 如果关闭的不是 当前页面，那么 当前页面 保持不变
    if (activeKey === targetKey) {
      activeKey = panes[lastIndex].key;
    }

    this.setState({ panes, menuKey: activeKey });
  };

  public render() {
    const { collapsed, panes, menuKey } = this.state;

    const topNavProp: TopNavProps = {
      collapsed,
      onClick: this.toggle
    };

    return (
      <Layout>
        <Header>
          <div className="logo" />
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['2']}
            style={{ lineHeight: '64px' }}
          >
            <Menu.Item key="1">nav 1</Menu.Item>
            <Menu.Item key="2">nav 2</Menu.Item>
          </Menu>
        </Header>
        <Layout>
          <Sider
            width={200}
            style={{ background: '#fff' }}
            trigger={null}
            collapsible={true}
            collapsed={this.state.collapsed}
          >
            <Menu
              mode="inline"
              defaultSelectedKeys={['1']}
              defaultOpenKeys={['sub1']}
              style={{ height: '100%', borderRight: 0 }}
              onClick={this.onClickMenu}
            >
              <SubMenu
                key="sub1"
                title={
                  <span>
                    <Icon type="user" />
                    <span>支出分析</span>
                  </span>
                }
              >
                <Menu.Item key="matAmtCluster">采购集中度</Menu.Item>
                <Menu.Item key="matTrendLeft">物料延续性(L)</Menu.Item>
                <Menu.Item key="matTrendRight">物料延续性(R)</Menu.Item>
                <Menu.Item key="matPriceVar">采购价格波动</Menu.Item>
                <Menu.Item key="matNew">新物料趋势</Menu.Item>
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
              </SubMenu>
            </Menu>
          </Sider>
          <Layout style={{ padding: '0 8px 8px' }}>
            {false ? <TopNav {...topNavProp} /> : ''}
            <Content
              style={{
                background: '#fff',
                margin: 0,
                minHeight: 550,
                padding: 8
              }}
            >
              <Tabs
                hideAdd={true}
                onChange={this.onPaneChange}
                activeKey={menuKey}
                type="editable-card"
                onEdit={this.onEdit}
              >
                {panes.map(pane => (
                  <TabPane tab={pane.title} key={pane.key}>
                    {this.showPage(pane.key)}
                  </TabPane>
                ))}
              </Tabs>
            </Content>

            <Footer style={{ textAlign: 'center' }}>
              Dajun Insights ©2018 Created by BPIT
            </Footer>
          </Layout>
        </Layout>
      </Layout>
    );
  }
}

export default StartPoint;
