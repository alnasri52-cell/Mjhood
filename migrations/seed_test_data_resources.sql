-- Seed Test Data: Resources (50 test resource pins)
-- This creates 50 resources across different categories and locations in Riyadh area
-- Uses NULL for user_id since we don't have test users set up yet
-- Note: You may want to update user_id values later with real user IDs

-- First, let's make user_id nullable temporarily for test data
ALTER TABLE resources ALTER COLUMN user_id DROP NOT NULL;

INSERT INTO resources (user_id, title, description, category, latitude, longitude, availability_type, price_type, price_min, price_max, price_currency, contact_phone, contact_method, created_at) VALUES

-- Tools & Equipment (10 resources)
(NULL, 'مثقاب كهربائي احترافي', 'مثقاب Bosch قوي للإيجار اليومي. مناسب لجميع أعمال البناء والتركيب.', 'Tools & Equipment', 24.7136, 46.6753, 'rent', 'fixed', 50, NULL, 'SAR', '+966501234567', 'both', NOW()),
(NULL, 'منشار كهربائي', 'منشار دائري للإيجار. حالة ممتازة مع ملحقات كاملة.', 'Tools & Equipment', 24.7245, 46.6891, 'rent', 'fixed', 40, NULL, 'SAR', '+966501234568', 'message', NOW()),
(NULL, 'سلم ألمنيوم 6 متر', 'سلم قابل للطي للإيجار أو البيع. آمن ومتين.', 'Tools & Equipment', 24.7089, 46.6612, 'both', 'negotiable', NULL, NULL, 'SAR', '+966501234569', 'phone', NOW()),
(NULL, 'مولد كهرباء', 'مولد 5 كيلو للإيجار. مثالي للمناسبات والطوارئ.', 'Tools & Equipment', 24.7312, 46.7023, 'rent', 'fixed', 150, NULL, 'SAR', '+966501234570', 'both', NOW()),
(NULL, 'عدة نجارة كاملة', 'عدة نجارة احترافية للاستعارة. منشار، مطرقة، أزاميل، ومسامير.', 'Tools & Equipment', 24.6987, 46.6534, 'borrow', 'free', NULL, NULL, 'SAR', '+966501234571', 'message', NOW()),
(NULL, 'ماكينة لحام', 'ماكينة لحام كهربائية للإيجار اليومي أو الأسبوعي.', 'Tools & Equipment', 24.7423, 46.7156, 'rent', 'range', 80, 200, 'SAR', '+966501234572', 'both', NOW()),
(NULL, 'كمبروسر هواء', 'كمبروسر قوي للإيجار. مناسب للدهان والنفخ.', 'Tools & Equipment', 24.7156, 46.6445, 'rent', 'fixed', 100, NULL, 'SAR', '+966501234573', 'phone', NOW()),
(NULL, 'عدة سباكة', 'عدة سباكة كاملة للاستعارة. مفاتيح ربط وأدوات قطع.', 'Tools & Equipment', 24.6876, 46.6789, 'borrow', 'free', NULL, NULL, 'SAR', '+966501234574', 'message', NOW()),
(NULL, 'جهاز قياس ليزر', 'جهاز قياس مسافات ليزر دقيق للإيجار.', 'Tools & Equipment', 24.7534, 46.7289, 'rent', 'fixed', 30, NULL, 'SAR', '+966501234575', 'both', NOW()),
(NULL, 'مكنسة كهربائية صناعية', 'مكنسة قوية للتنظيف بعد البناء. للإيجار اليومي.', 'Tools & Equipment', 24.7267, 46.6567, 'rent', 'fixed', 60, NULL, 'SAR', '+966501234576', 'message', NOW()),

-- Vehicles (8 resources)
(NULL, 'بيك اب للنقل', 'بيك اب نظيف للإيجار اليومي. مثالي لنقل العفش والمواد.', 'Vehicles', 24.7178, 46.6834, 'rent', 'fixed', 200, NULL, 'SAR', '+966501234577', 'both', NOW()),
(NULL, 'دراجة هوائية', 'دراجة جبلية للإيجار أو الاستعارة. حالة ممتازة.', 'Vehicles', 24.6998, 46.6923, 'both', 'fixed', 30, NULL, 'SAR', '+966501234578', 'message', NOW()),
(NULL, 'سيارة عائلية', 'سيارة 7 راكب للإيجار. نظيفة ومريحة للرحلات.', 'Vehicles', 24.7345, 46.7134, 'rent', 'range', 150, 250, 'SAR', '+966501234579', 'phone', NOW()),
(NULL, 'دباب صحراوي', 'دباب للرحلات البرية. للإيجار اليومي أو الأسبوعي.', 'Vehicles', 24.6789, 46.6456, 'rent', 'range', 200, 500, 'SAR', '+966501234580', 'both', NOW()),
(NULL, 'سكوتر كهربائي', 'سكوتر للتنقل السريع. للإيجار أو الاستعارة.', 'Vehicles', 24.7456, 46.7267, 'both', 'fixed', 40, NULL, 'SAR', '+966501234581', 'message', NOW()),
(NULL, 'فان نقل', 'فان واسع لنقل البضائع. للإيجار بالساعة أو اليوم.', 'Vehicles', 24.7123, 46.6678, 'rent', 'negotiable', NULL, NULL, 'SAR', '+966501234582', 'both', NOW()),
(NULL, 'كرفان تخييم', 'كرفان مجهز للرحلات. للإيجار الأسبوعي.', 'Vehicles', 24.6912, 46.6812, 'rent', 'fixed', 800, NULL, 'SAR', '+966501234583', 'phone', NOW()),
(NULL, 'دراجة نارية', 'دراجة نارية 250cc للإيجار. رخصة مطلوبة.', 'Vehicles', 24.7567, 46.7389, 'rent', 'fixed', 180, NULL, 'SAR', '+966501234584', 'both', NOW()),

-- Storage Space (6 resources)
(NULL, 'مستودع صغير', 'مستودع 20 متر مربع للإيجار الشهري. آمن ونظيف.', 'Storage Space', 24.7234, 46.6945, 'rent', 'fixed', 500, NULL, 'SAR', '+966501234585', 'phone', NOW()),
(NULL, 'غرفة تخزين', 'غرفة 10 متر للتخزين المؤقت. إيجار شهري.', 'Storage Space', 24.7012, 46.6734, 'rent', 'fixed', 300, NULL, 'SAR', '+966501234586', 'message', NOW()),
(NULL, 'كونتينر تخزين', 'كونتينر 40 قدم للإيجار. مناسب للتخزين طويل الأمد.', 'Storage Space', 24.7389, 46.7212, 'rent', 'fixed', 800, NULL, 'SAR', '+966501234587', 'both', NOW()),
(NULL, 'مخزن مكيف', 'مخزن مكيف 30 متر. مثالي للأثاث والإلكترونيات.', 'Storage Space', 24.6834, 46.6523, 'rent', 'range', 600, 1000, 'SAR', '+966501234588', 'phone', NOW()),
(NULL, 'جراج خاص', 'جراج للتخزين أو ركن السيارة. للإيجار الشهري.', 'Storage Space', 24.7478, 46.7345, 'rent', 'fixed', 400, NULL, 'SAR', '+966501234589', 'message', NOW()),
(NULL, 'مساحة تخزين مشتركة', 'مساحة تخزين مشتركة آمنة. إيجار بالمتر المربع.', 'Storage Space', 24.7145, 46.6856, 'rent', 'negotiable', NULL, NULL, 'SAR', '+966501234590', 'both', NOW()),

-- Event Space (5 resources)
(NULL, 'قاعة أفراح صغيرة', 'قاعة تتسع 100 شخص. مجهزة بالكامل للمناسبات.', 'Event Space', 24.7256, 46.7023, 'rent', 'range', 2000, 5000, 'SAR', '+966501234591', 'phone', NOW()),
(NULL, 'استراحة للمناسبات', 'استراحة واسعة مع حديقة. للإيجار اليومي.', 'Event Space', 24.6923, 46.6645, 'rent', 'fixed', 1500, NULL, 'SAR', '+966501234592', 'both', NOW()),
(NULL, 'قاعة اجتماعات', 'قاعة اجتماعات مجهزة. تتسع 30 شخص.', 'Event Space', 24.7412, 46.7289, 'rent', 'fixed', 500, NULL, 'SAR', '+966501234593', 'message', NOW()),
(NULL, 'حديقة للمناسبات', 'حديقة كبيرة للحفلات الخارجية. للإيجار اليومي.', 'Event Space', 24.7089, 46.6789, 'rent', 'range', 1000, 3000, 'SAR', '+966501234594', 'phone', NOW()),
(NULL, 'مخيم للفعاليات', 'مخيم مجهز للفعاليات والمناسبات. يتسع 50 شخص.', 'Event Space', 24.7534, 46.7412, 'rent', 'fixed', 2500, NULL, 'SAR', '+966501234595', 'both', NOW()),

-- Parking Space (4 resources)
(NULL, 'موقف سيارة مغطى', 'موقف مغطى آمن. للإيجار الشهري.', 'Parking Space', 24.7167, 46.6912, 'rent', 'fixed', 200, NULL, 'SAR', '+966501234596', 'message', NOW()),
(NULL, 'موقف خارجي', 'موقف خارجي قريب من المترو. إيجار شهري.', 'Parking Space', 24.7045, 46.6723, 'rent', 'fixed', 150, NULL, 'SAR', '+966501234597', 'phone', NOW()),
(NULL, 'جراج تحت الأرض', 'موقف تحت الأرض آمن. للإيجار الشهري أو السنوي.', 'Parking Space', 24.7378, 46.7156, 'rent', 'range', 250, 2500, 'SAR', '+966501234598', 'both', NOW()),
(NULL, 'موقف قريب من الجامعة', 'موقف مناسب للطلاب. إيجار شهري مخفض.', 'Parking Space', 24.6878, 46.6567, 'rent', 'fixed', 120, NULL, 'SAR', '+966501234599', 'message', NOW()),

-- Sports Equipment (5 resources)
(NULL, 'دراجة رياضية', 'دراجة تمارين منزلية للإيجار. حالة ممتازة.', 'Sports Equipment', 24.7489, 46.7323, 'rent', 'fixed', 100, NULL, 'SAR', '+966501234600', 'both', NOW()),
(NULL, 'أوزان رياضية', 'طقم أوزان كامل للاستعارة. من 5 إلى 30 كيلو.', 'Sports Equipment', 24.7178, 46.6834, 'borrow', 'free', NULL, NULL, 'SAR', '+966501234601', 'message', NOW()),
(NULL, 'خيمة تخييم', 'خيمة 6 أشخاص للإيجار. مع معدات تخييم كاملة.', 'Sports Equipment', 24.6967, 46.6678, 'rent', 'fixed', 150, NULL, 'SAR', '+966501234602', 'phone', NOW()),
(NULL, 'كرة سلة وشبكة', 'كرة سلة مع شبكة قابلة للتعديل. للاستعارة.', 'Sports Equipment', 24.7423, 46.7234, 'borrow', 'free', NULL, NULL, 'SAR', '+966501234603', 'message', NOW()),
(NULL, 'معدات غوص', 'معدات غوص كاملة للإيجار. بدلة، نظارة، وزعانف.', 'Sports Equipment', 24.7112, 46.6789, 'rent', 'range', 200, 400, 'SAR', '+966501234604', 'both', NOW()),

-- Electronics (4 resources)
(NULL, 'بروجكتر HD', 'بروجكتر عالي الدقة للإيجار. مثالي للعروض والأفلام.', 'Electronics', 24.7289, 46.7045, 'rent', 'fixed', 150, NULL, 'SAR', '+966501234605', 'phone', NOW()),
(NULL, 'كاميرا احترافية', 'كاميرا Canon DSLR للإيجار اليومي. مع عدسات.', 'Electronics', 24.7034, 46.6712, 'rent', 'fixed', 250, NULL, 'SAR', '+966501234606', 'both', NOW()),
(NULL, 'سماعات حفلات', 'سماعات قوية للمناسبات. للإيجار مع ميكروفونات.', 'Electronics', 24.7401, 46.7178, 'rent', 'range', 300, 600, 'SAR', '+966501234607', 'message', NOW()),
(NULL, 'بلايستيشن 5', 'PS5 مع ألعاب للإيجار الأسبوعي. حالة ممتازة.', 'Electronics', 24.6889, 46.6589, 'rent', 'fixed', 200, NULL, 'SAR', '+966501234608', 'phone', NOW()),

-- Furniture (3 resources)
(NULL, 'طاولات وكراسي للمناسبات', '20 طاولة و 100 كرسي للإيجار. مناسب للحفلات.', 'Furniture', 24.7512, 46.7356, 'rent', 'negotiable', NULL, NULL, 'SAR', '+966501234609', 'both', NOW()),
(NULL, 'أريكة مريحة', 'أريكة 3 مقاعد للإيجار المؤقت. نظيفة ومريحة.', 'Furniture', 24.7189, 46.6867, 'rent', 'fixed', 300, NULL, 'SAR', '+966501234610', 'message', NOW()),
(NULL, 'سرير أطفال', 'سرير أطفال للاستعارة. آمن ونظيف.', 'Furniture', 24.6978, 46.6701, 'borrow', 'free', NULL, NULL, 'SAR', '+966501234611', 'phone', NOW()),

-- Garden Equipment (3 resources)
(NULL, 'جزازة عشب', 'جزازة عشب كهربائية للإيجار. سهلة الاستخدام.', 'Garden Equipment', 24.7434, 46.7267, 'rent', 'fixed', 80, NULL, 'SAR', '+966501234612', 'both', NOW()),
(NULL, 'خرطوم ري طويل', 'خرطوم ري 50 متر للاستعارة. مع رشاش.', 'Garden Equipment', 24.7123, 46.6812, 'borrow', 'free', NULL, NULL, 'SAR', '+966501234613', 'message', NOW()),
(NULL, 'مقص تشذيب كهربائي', 'مقص تشذيب للأشجار والشجيرات. للإيجار اليومي.', 'Garden Equipment', 24.6912, 46.6623, 'rent', 'fixed', 60, NULL, 'SAR', '+966501234614', 'phone', NOW()),

-- Party Supplies (2 resources)
(NULL, 'نطيطة أطفال', 'نطيطة كبيرة للحفلات. للإيجار اليومي مع التوصيل.', 'Party Supplies', 24.7456, 46.7312, 'rent', 'fixed', 400, NULL, 'SAR', '+966501234615', 'both', NOW()),
(NULL, 'ديكورات حفلات', 'بالونات، أقواس، وديكورات متنوعة. للإيجار أو البيع.', 'Party Supplies', 24.7201, 46.6923, 'both', 'negotiable', NULL, NULL, 'SAR', '+966501234616', 'message', NOW());
