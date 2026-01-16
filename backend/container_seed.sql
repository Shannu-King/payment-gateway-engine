-- Seed container Postgres with a test merchant and 7 successful payments
BEGIN;
INSERT INTO merchants (id, name, api_key) VALUES ('11111111-1111-1111-1111-111111111111', 'Container Merchant', 'test_key_container') ON CONFLICT (id) DO NOTHING;

INSERT INTO payments (id, order_id, merchant_id, amount, status, method, created_at, updated_at) VALUES
('pay_demo_1','order_demo_1','11111111-1111-1111-1111-111111111111',1000,'success','card',NOW(),NOW()),
('pay_demo_2','order_demo_2','11111111-1111-1111-1111-111111111111',1100,'success','upi',NOW(),NOW()),
('pay_demo_3','order_demo_3','11111111-1111-1111-1111-111111111111',1200,'success','card',NOW(),NOW()),
('pay_demo_4','order_demo_4','11111111-1111-1111-1111-111111111111',1300,'success','upi',NOW(),NOW()),
('pay_demo_5','order_demo_5','11111111-1111-1111-1111-111111111111',1400,'success','card',NOW(),NOW()),
('pay_demo_6','order_demo_6','11111111-1111-1111-1111-111111111111',1500,'success','upi',NOW(),NOW()),
('pay_demo_7','order_demo_7','11111111-1111-1111-1111-111111111111',1600,'success','card',NOW(),NOW());

COMMIT;
