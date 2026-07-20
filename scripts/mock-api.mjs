import http from 'node:http'

const categories = [
  { id: 1, name: 'Cà phê', slug: 'ca-phe', imageUrl: '/images/menu/coffee.webp', sortOrder: 1, isActive: true },
  { id: 2, name: 'Ca cao', slug: 'ca-cao', imageUrl: '/images/menu/cacao.webp', sortOrder: 2, isActive: true },
  { id: 3, name: 'Sữa chua', slug: 'sua-chua', imageUrl: '/images/menu/yogurt.webp', sortOrder: 3, isActive: true },
  { id: 4, name: 'Nước giải khát', slug: 'nuoc-giai-khat', imageUrl: '/images/menu/citrus.webp', sortOrder: 4, isActive: true },
]
const items = [
  [1,1,'Cà phê đen đá',15000,'coffee'],[2,1,'Cà phê sữa đá',15000,'coffee'],[3,1,'Bạc xỉu',20000,'coffee'],[4,1,'Cà phê muối',17000,'coffee'],[5,1,'Cà phê kem trứng',20000,'coffee'],
  [6,2,'Ca cao nóng',20000,'cacao'],[7,2,'Ca cao đá kem muối',20000,'cacao'],[8,3,'Sữa chua đá',17000,'yogurt'],[9,3,'Sữa chua việt quất',20000,'yogurt'],[10,3,'Sữa chua dâu',20000,'yogurt'],[11,3,'Matcha latte',20000,'yogurt'],[12,4,'Trà tắc',15000,'citrus'],[13,4,'Trà chanh',15000,'citrus'],[14,4,'Nước cam',20000,'citrus'],
]
const products = items.map(([id, categoryId, name, price, image]) => ({ id, categoryId, name, slug: String(name).toLowerCase().replaceAll(' ','-'), description: null, price, imageUrl: `/images/menu/${image}.webp`, isOutOfStock: false, isActive: true, category: categories.find((c) => c.id === categoryId) }))
const quotes = [
  { id: 1, content: 'Bạn không cần vội. Một ngụm cà phê, một hơi thở sâu, rồi mọi chuyện sẽ dần vào đúng chỗ.', topic: 'Chữa lành' },
  { id: 2, content: 'Cảm ơn bạn đã ghé. Mong hôm nay sẽ đối xử với bạn thật nhẹ nhàng.', topic: 'Từ Cái Tiệm' },
]

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  const path = req.url?.split('?')[0]
  if (path === '/api/categories') return res.end(JSON.stringify({ success: true, data: categories }))
  if (path === '/api/products') return res.end(JSON.stringify({ success: true, data: products }))
  if (path === '/api/settings/public') return res.end(JSON.stringify({ success: true, data: { shop_name: 'Cái Tiệm', shop_phone: '0914.780.342', shop_address: '', shipping_fee: '0', is_accepting_orders: 'true' } }))
  if (path === '/api/vibe/random') return res.end(JSON.stringify({ success: true, data: quotes[Math.floor(Math.random() * quotes.length)] }))
  if (path === '/api/orders' && req.method === 'POST') { res.statusCode = 201; return res.end(JSON.stringify({ success: true, data: { orderCode: 'CT-DEMO-001', totalAmount: 15000 } })) }
  if (path === '/api/admin/login' && req.method === 'POST') return res.end(JSON.stringify({ success: true, data: { token: 'mock-admin-token', user: { id: 1, username: 'admin', role: 'admin' } } }))
  if (path === '/api/admin/dashboard') return res.end(JSON.stringify({ success: true, data: { orderCount: 3, orderValue: 115000, quoteScans: 128, productCount: 14 } }))
  if (path === '/api/admin/categories') return res.end(JSON.stringify({ success: true, data: categories }))
  if (path === '/api/admin/products') return res.end(JSON.stringify({ success: true, data: products }))
  if (path === '/api/admin/orders') return res.end(JSON.stringify({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, pages: 0 } }))
  if (path === '/api/admin/quotes') return res.end(JSON.stringify({ success: true, data: quotes.map((quote) => ({ ...quote, scanCount: 64, isActive: true })) }))
  if (path === '/api/admin/settings') return res.end(JSON.stringify({ success: true, data: { shop_name: 'Cái Tiệm', shop_phone: '0914.780.342', shop_address: '', shop_email: '', shipping_fee: '0', is_accepting_orders: 'true' } }))
  res.statusCode = 404; res.end(JSON.stringify({ success: false, message: 'Mock endpoint not found' }))
})
server.listen(3003, '127.0.0.1', () => console.log('Mock API http://127.0.0.1:3003'))
