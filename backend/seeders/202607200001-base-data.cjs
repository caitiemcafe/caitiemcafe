'use strict';
module.exports = { async up(q) {
  const now = new Date();
  await q.bulkInsert('categories', [
    { id: 1, name: 'Cà phê', slug: 'ca-phe', image_url: '/images/menu/coffee.webp', sort_order: 1, is_active: true, created_at: now, updated_at: now },
    { id: 2, name: 'Ca cao', slug: 'ca-cao', image_url: '/images/menu/cacao.webp', sort_order: 2, is_active: true, created_at: now, updated_at: now },
    { id: 3, name: 'Sữa chua', slug: 'sua-chua', image_url: '/images/menu/yogurt.webp', sort_order: 3, is_active: true, created_at: now, updated_at: now },
    { id: 4, name: 'Nước giải khát', slug: 'nuoc-giai-khat', image_url: '/images/menu/citrus.webp', sort_order: 4, is_active: true, created_at: now, updated_at: now },
  ]);
  const p = (id, category_id, name, slug, price, image) => ({ id, category_id, name, slug, price, image_url: image, description: null, is_out_of_stock: false, is_active: true, created_at: now, updated_at: now });
  await q.bulkInsert('products', [
    p(1,1,'Cà phê đen đá','ca-phe-den-da',15000,'/images/menu/coffee.webp'), p(2,1,'Cà phê sữa đá','ca-phe-sua-da',15000,'/images/menu/coffee.webp'),
    p(3,1,'Bạc xỉu','bac-xiu',20000,'/images/menu/coffee.webp'), p(4,1,'Cà phê muối','ca-phe-muoi',17000,'/images/menu/coffee.webp'), p(5,1,'Cà phê kem trứng','ca-phe-kem-trung',20000,'/images/menu/coffee.webp'),
    p(6,2,'Ca cao nóng','ca-cao-nong',20000,'/images/menu/cacao.webp'), p(7,2,'Ca cao đá kem muối','ca-cao-da-kem-muoi',20000,'/images/menu/cacao.webp'),
    p(8,3,'Sữa chua đá','sua-chua-da',17000,'/images/menu/yogurt.webp'), p(9,3,'Sữa chua việt quất','sua-chua-viet-quat',20000,'/images/menu/yogurt.webp'),
    p(10,3,'Sữa chua dâu','sua-chua-dau',20000,'/images/menu/yogurt.webp'), p(11,3,'Matcha latte','matcha-latte',20000,'/images/menu/yogurt.webp'),
    p(12,4,'Trà tắc','tra-tac',15000,'/images/menu/citrus.webp'), p(13,4,'Trà chanh','tra-chanh',15000,'/images/menu/citrus.webp'), p(14,4,'Nước cam','nuoc-cam',20000,'/images/menu/citrus.webp'),
  ]);
  await q.bulkInsert('settings', [
    { key: 'shipping_fee', value: '0', created_at: now, updated_at: now },
    { key: 'shop_name', value: 'Cái Tiệm', created_at: now, updated_at: now },
    { key: 'shop_phone', value: '0914.780.342', created_at: now, updated_at: now },
    { key: 'shop_address', value: '391 Giải Phóng, Xã Krông Pắc, Đắk Lắk', created_at: now, updated_at: now },
    { key: 'shop_email', value: 'hoangvan050602@gmail.com', created_at: now, updated_at: now },
    { key: 'shop_opening_hours', value: '06:00 - 16:00 (6h sáng - 4h chiều)', created_at: now, updated_at: now },
    { key: 'is_accepting_orders', value: 'true', created_at: now, updated_at: now },
  ]);
}, async down(q) { await q.bulkDelete('products', null, {}); await q.bulkDelete('categories', null, {}); await q.bulkDelete('settings', null, {}); } };
