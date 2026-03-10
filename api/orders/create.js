const cloudbase = require('@cloudbase/node-sdk');
const config = require('../../cloudbase.config.js');

// 初始化CloudBase
const app = cloudbase.init({
  env: config.env
});

const db = app.database();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    const { customerPhone, createdBy, createdByName, ...orderData } = req.body;

    // 1. 防重复：检查24小时内是否有相同电话的订单
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const duplicateResult = await db.collection('orders')
      .where({
        customerPhone: customerPhone,
        createdAt: db.command.gte(oneDayAgo.toISOString())
      })
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (duplicateResult.data.length > 0) {
      const duplicateOrder = duplicateResult.data[0];
      const orderTime = new Date(duplicateOrder.createdAt);
      const timeStr = `${orderTime.getMonth() + 1}-${orderTime.getDate()} ${orderTime.getHours()}:${String(orderTime.getMinutes()).padStart(2, '0')}`;
      return res.status(400).json({
        success: false,
        message: `该客户已在 ${timeStr} 被录入，请联系 ${duplicateOrder.createdByName}`
      });
    }

    // 2. 创建新订单（防抢单：自动分配给创建者）
    const newOrder = {
      customerPhone,
      createdBy,
      createdByName,
      createdAt: now.toISOString(),
      status: 'new',
      ...orderData
    };

    const result = await db.collection('orders').add(newOrder);

    // 3. 返回创建的订单
    res.status(200).json({
      success: true,
      order: {
        id: result.id,
        ...newOrder
      }
    });

  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}
