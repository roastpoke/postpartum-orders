export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    const { customerPhone, createdBy, ...orderData } = req.body;

    // 模拟数据库（实际使用应该连接真实数据库）
    const orders = global.orders || [];

    // 防重复：检查24小时内是否有相同电话的订单
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    const duplicateOrder = orders.find(order => {
      if (order.customerPhone === customerPhone) {
        const orderDate = new Date(order.createdAt);
        return orderDate > oneDayAgo;
      }
      return false;
    });

    if (duplicateOrder) {
      const orderTime = new Date(duplicateOrder.createdAt);
      const timeStr = `${orderTime.getMonth() + 1}-${orderTime.getDate()} ${orderTime.getHours()}:${String(orderTime.getMinutes()).padStart(2, '0')}`;
      return res.status(400).json({
        success: false,
        message: `该客户已在 ${timeStr} 被录入，请联系 ${duplicateOrder.createdByName}`
      });
    }

    // 创建新订单（防抢单：自动分配给创建者）
    const newOrder = {
      id: Date.now().toString(),
      customerPhone,
      createdBy,
      createdAt: now.toISOString(),
      status: 'new',
      ...orderData
    };

    orders.unshift(newOrder);
    global.orders = orders;

    res.status(200).json({
      success: true,
      order: newOrder
    });

  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}
