export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    const { userId, role, statusFilter, dateFilter } = req.body;

    // 模拟数据库
    let orders = global.orders || [];

    // 权限隔离：员工只能看自己的，主管可以看所有
    if (role !== 'admin') {
      orders = orders.filter(order => order.createdBy === userId);
    }

    // 状态筛选
    if (statusFilter) {
      orders = orders.filter(order => order.status === statusFilter);
    }

    // 时间筛选
    if (dateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (dateFilter === 'today') {
        orders = orders.filter(order => new Date(order.createdAt) >= today);
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today - 7 * 24 * 60 * 60 * 1000);
        orders = orders.filter(order => new Date(order.createdAt) >= weekAgo);
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today - 30 * 24 * 60 * 60 * 1000);
        orders = orders.filter(order => new Date(order.createdAt) >= monthAgo);
      }
    }

    res.status(200).json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}
