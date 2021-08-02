import { message, Popconfirm } from 'antd';
import React, { useState, useRef } from 'react';
import { useHistory } from "react-router-dom";
import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import { ModalForm, ProFormTextArea } from '@ant-design/pro-form';
import moment from 'moment';
import { updateTask, task } from './service';

/**
 * 更新节点
 *
 * @param fields
 */

export const handleUpdate = async (fields) => {
  const hide = message.loading('正在更新');
  try {
    await updateTask(fields);
    hide();
    message.success('更新成功');
    return true;
  } catch (error) {
    hide();
    message.error('更新失败请重试！');
    return false;
  }
};

const expandedRowRender = (row) => {
  const data = row.exec_items || [];
  return <ProTable
    columns={[
      { title: '序号', dataIndex: 'id' },
      { title: '数据库', dataIndex: 'db_name' },
      { title: '任务类型', dataIndex: 'task_type' },
      { title: '影响行数', dataIndex: 'affect_rows' },
      { title: '状态', dataIndex: 'status' },
      { title: '执行信息', dataIndex: 'exec_info' },
      { title: 'SQL语句', dataIndex: 'sql_content', valueType: 'code' },
      { title: '备注', dataIndex: 'remark' },
    ]}
    rowKey="id"
    headerTitle={false}
    search={false}
    options={false}
    dataSource={data}
    pagination={false}
  />
}

const TableList = () => {
  /** 窗口的弹窗 */
  const [modalVisible, handleModalVisible] = useState(false);
  /** 分布更新窗口的弹窗 */
  const actionRef = useRef();
  /** 保存操作任务 */
  const taskRef = useRef(null);
  /** 路由 */
  const history = useHistory();

  const columns = [
    {
      title: 'id',
      dataIndex: 'id',
      hideInSearch: true,
    },
    {
      title: '名称',
      dataIndex: 'name',
      formItemProps: {
        label: '模糊搜索',
        name: 'key',
      },
    },
    {
      title: '状态',
      dataIndex: 'status_name',
      hideInSearch: true,
    },
    {
      title: '创建者',
      dataIndex: 'creator',
      hideInSearch: true,
    },
    {
      title: '待执行时间',
      dataIndex: 'ct',
      render: (v) => v ? moment.unix(v).format('YYYY-MM-DD HH:mm:ss') : '-',
      hideInSearch: true,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <Popconfirm
          key="reject"
          onConfirm={async () => {
            taskRef.current = record;
            handleModalVisible(true);
          }}
          title={`确定驳回 ${record.name} 么？`}
        >
          <a>
            驳回
          </a>
        </Popconfirm>,
        <a
          key="submit"
          onClick={() => {
            history.push(`/task/detail/${record.id}`)
          }}>
          提交执行
        </a>,
      ],
    },
  ];
  return (
    <PageContainer title="任务执行">
      <ProTable
        actionRef={actionRef}
        rowKey="id"
        search={{
          collapsed: false,
          optionRender: (searchConfig, formProps, dom) => [
            ...dom.reverse(),
          ],
        }}
        options={false}
        expandable={{expandedRowRender}}
        request={async (params) => {
          const { current, pageSize, ...rest } = params;
          const pagination = {
            limit: pageSize,
            offset: (current - 1) * pageSize,
            ...rest,
          };
          const result = await task(pagination);
          return {
            total: result.total,
            data: result.items,
            success: true,
          }
        }}
        columns={columns}
      />
      <ModalForm
        title="驳回"
        width="400px"
        modalProps={{destroyOnClose: true}}
        visible={modalVisible}
        onVisibleChange={handleModalVisible}
        onFinish={async (fields) => {
          const success = await handleUpdate({
            id: taskRef.current.id,
            action: 'reject',
            ...fields,
          });
          if (success) {
            handleModalVisible(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
      >
        <ProFormTextArea
          width="md"
          name="reject_content"
          label="驳回理由"
          rules={[
            {
              required: true,
              message: '请输入驳回理由',
            },
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default TableList;