-- 03 · Store content: settings, home banners and static pages.
-- Placeholder copy — edit everything later in Admin → Home page / Pages / Settings.
-- Details marked [to confirm] need your real information.

update public.store_settings
set
  promo_ticker = array[
    'Free shipping across India on orders above ₹999',
    'Handmade with love by Indian makers',
    'Visit our retail store'
  ],
  home_intro = 'Welcome to **Dream Needles**, your home for crochet and knitting. We make handmade crochet flowers, key chains, baby blankets, toys, bags, hair accessories, rakhis, shawls and cardigans, each piece stitched by hand. Makers can also find everything they need to start their own projects, from crochet hooks and knitting needles to stitch markers, punch needles and project bags. Shop online across India, or visit our retail store to see and feel the yarn in person.',
  home_stats = '[
    {"value": "350+", "label": "Handmade designs"},
    {"value": "12K+", "label": "Orders delivered"},
    {"value": "4.9★", "label": "Average rating"},
    {"value": "28K+", "label": "Pincodes we deliver to"}
  ]'::jsonb,
  marketplaces = '[
    {"name": "Amazon", "url": "", "logo_path": "/images/home/marketplace-amazon.png"},
    {"name": "Flipkart", "url": "", "logo_path": "/images/home/marketplace-flipkart.png"},
    {"name": "Myntra", "url": "", "logo_path": "/images/home/marketplace-myntra.png"},
    {"name": "Pepperfry", "url": "", "logo_path": "/images/home/marketplace-pepperfry.png"}
  ]'::jsonb,
  social_links = '{"facebook": "", "instagram": "", "youtube": "", "whatsapp": ""}'::jsonb,
  contact_email = 'care@dreamneedles.in',
  contact_phone = null,
  whatsapp_number = null,
  store_address = '[to confirm] No. 42, Craft Avenue, T. Nagar, Chennai'
where id = 1;

insert into public.banners (id, placement, title, subtitle, cta_label, image_path, link_url, sort_order)
values
  ('6f1d2b8e-0a51-5c3a-9e0f-1a2b3c4d5e01', 'hero', 'Crochet Flowers', 'Everlasting blooms, handmade petal by petal', 'Shop Crochet Flowers',
    '/images/home/homepage-kaivannam-store-crochet-flower.jpg', '/collections/crochet-flowers', 0),
  ('6f1d2b8e-0a51-5c3a-9e0f-1a2b3c4d5e02', 'hero', 'Key Chains', 'Tiny amigurumi charms for keys and bags', 'Shop Key Chains',
    '/images/home/homepage-kaivannam-store-key-chain.jpg', '/collections/key-chains', 1),
  ('6f1d2b8e-0a51-5c3a-9e0f-1a2b3c4d5e11', 'tile', 'Fridge Magnets', '', null,
    '/images/home/homepage-fridge-magnets.png', '/collections/fridge-magnets', 0),
  ('6f1d2b8e-0a51-5c3a-9e0f-1a2b3c4d5e12', 'tile', 'Hair Accessories', '', null,
    '/images/home/homepage-hair-accessories.png', '/collections/hair-accessories', 1),
  ('6f1d2b8e-0a51-5c3a-9e0f-1a2b3c4d5e13', 'tile', 'Sweaters & Cardigans', '', null,
    '/images/home/homepage-sweaters-and-cardigans.png', '/collections/sweaters-cardigans', 2),
  ('6f1d2b8e-0a51-5c3a-9e0f-1a2b3c4d5e14', 'tile', 'Wall Hanging', '', null,
    '/images/home/homepage-wall-hanging.png', '/collections/wall-hangings', 3),
  ('6f1d2b8e-0a51-5c3a-9e0f-1a2b3c4d5e21', 'category', 'Home Decor', 'Cosy handmade pieces for every room', 'Shop Now',
    '/images/home/category-home-decor.jpg', '/collections/home-decor', 0),
  ('6f1d2b8e-0a51-5c3a-9e0f-1a2b3c4d5e22', 'category', 'Accessories', 'Bags, hair accessories and rakhis', 'Shop Now',
    '/images/home/category-accessories.jpg', '/collections/handmade-accessories', 1),
  ('6f1d2b8e-0a51-5c3a-9e0f-1a2b3c4d5e23', 'category', 'Apparel', 'Handmade wear, made to last', 'Shop Now',
    '/images/home/category-apparel.jpg', '/collections/apparel', 2),
  ('6f1d2b8e-0a51-5c3a-9e0f-1a2b3c4d5e24', 'category', 'Tools', 'Everything you need to start', 'Shop Now',
    '/images/home/category-tools.jpg', '/collections/tools', 3)
on conflict (id) do nothing;

insert into public.pages (slug, title, seo_description, body_markdown)
values
('our-story', 'Our Story', 'How Dream Needles began, and the makers behind every stitch.', $md$
Founded in 2018, Dream Needles is dedicated to bringing together premium yarns, handmade accessories, and thoughtfully crafted tools for makers of all kinds. What began as an intimate passion circle sharing handmade wool creations quickly revealed a yearning across India: crafters sought pure natural fibers, authentic tools, and a reliable sanctuary where timeless textile artistry could thrive.

At Dream Needles, we believe that making something with your hands shows care, patience, and love. That belief shapes everything we do, from the yarns we develop to the vibrant artisan communities we nurture.
$md$),
('faq', 'Frequently Asked Questions', 'Answers about orders, shipping, returns and our handmade products.', $md$
## How long will my order take to arrive?

Orders are packed on the next working day and usually arrive within 3–5 business days. Remote pincodes can take longer. You can check delivery to your pincode on any product page.

## Do you offer free shipping?

Yes. Shipping is free on orders above ₹999 anywhere in India. Below that, a flat shipping fee is shown at checkout.

## Which payment methods do you accept?

We accept UPI (GPay, PhonePe, Paytm), credit and debit cards (Visa, Mastercard, RuPay), net banking and wallets, all processed securely by Razorpay. We don't offer cash on delivery.

## Do you offer cash on delivery?

Not at the moment. All orders are prepaid online.

## Can I return a product?

Finished handmade products can be returned within 7 days of delivery if they're unused and in their original packaging. Tools, yarn and custom pieces are final sale. See our [Refund Policy](/refund-policy) for details.

## My product arrived damaged. What should I do?

Contact us within 72 hours of delivery with your order number and an unboxing video, and we'll arrange a replacement or store credit.

## Are your handmade items exactly like the photos?

Each piece is made by hand, so small variations in colour and size are normal. They make every piece unique.

## How do I care for crochet items?

Hand wash in cold water with mild detergent, gently squeeze out the water (don't wring), and dry flat in the shade.

## Can I place a custom order?

Yes. Write to us through the [Contact Us](/contact) page with what you have in mind, and we'll get back to you.
$md$),
('shipping-policy', 'Shipping Policy', 'Delivery times, charges and tracking for Dream Needles orders.', $md$
## Processing time

All confirmed orders are inspected, packed and dispatched from the next working day. Orders placed on Sundays, public holidays or during sales may take a little longer.

## Delivery time

Most orders arrive within 3–5 business days of dispatch. Remote areas can take up to 10 business days.

## Shipping charges

Shipping is **free on orders above ₹999**. Below that, a flat shipping fee is shown at checkout before you pay.

## Tracking

Once your order ships, we'll email you the tracking details. You can also see them under **My Account → Orders**.

## Address accuracy

Please double-check your phone number, flat number and pincode before paying. We can't change the address once the order is dispatched.

## Damaged or missing parcels

If your parcel arrives damaged, or tracking says delivered but you haven't received it, contact us within 72 hours of the delivery date.
$md$),
('refund-policy', 'Refund Policy', 'Returns, cancellations and refunds at Dream Needles.', $md$
## Returns

Finished handmade products can be returned within **7 days** of delivery if they're unused and in their original packaging. Tools, yarn and custom-made pieces are final sale for hygiene reasons.

## Damaged, defective or incorrect products

Tell us within **72 hours** of delivery with your order number and an unedited unboxing video. Once we've checked it (usually within 5 business days), we'll send a replacement or issue a refund or store credit.

## Cancellations

You can cancel an order before it's dispatched. A 2.5% payment-gateway fee is deducted from the refund. Orders can't be cancelled after dispatch.

## Return to origin (RTO)

If a parcel comes back to us because it couldn't be delivered, we can re-ship it once the two-way shipping cost is paid. Otherwise the amount, minus shipping and a ₹50 / 1% handling fee, is given as store credit.

## How refunds are paid

Approved refunds go back to your original payment method within 5–7 business days of approval.

## Contact

Questions? Reach us through the [Contact Us](/contact) page, 10:00 AM – 6:00 PM IST, Monday to Saturday.
$md$),
('privacy-policy', 'Privacy Policy', 'How Dream Needles collects, uses and protects your personal information.', $md$
This Privacy Policy explains how we collect, use and share your personal information when you visit or buy from Dream Needles.

## What we collect

- **Account details:** your email address, name and phone number.
- **Order details:** shipping addresses, items purchased and order history.
- **Technical details:** basic device and browser information, used to keep the site working and secure.

## How we use it

To process and deliver your orders, send order updates, answer your questions and improve our store. We never sell your personal information.

## Who we share it with

- **Razorpay**, to process payments. Your card details never touch our servers.
- **Courier partners**, who only receive what's needed to deliver your parcel.
- **Supabase**, which securely hosts our database and sign-in.

## Your rights

Under India's Digital Personal Data Protection Act, 2023, you can ask us for a copy of your data, correct it, or ask us to delete your account. Some billing records must be kept for tax purposes.

## Contact

Email us at care@dreamneedles.in. We reply within 48 business hours.
$md$),
('terms', 'Terms of Service', 'The terms that apply when you use Dream Needles.', $md$
By using Dream Needles and placing an order, you agree to these terms.

## Products and prices

Prices are in Indian Rupees and include GST. Handmade items can vary slightly from their photos. We may correct pricing errors and cancel affected orders with a full refund.

## Orders

An order is confirmed once payment succeeds. We may cancel an order if a product turns out to be unavailable, and we'll refund you in full.

## Accounts

You're responsible for keeping access to your email account secure, since we use it to sign you in.

## Policies

Our [Shipping Policy](/shipping-policy), [Refund Policy](/refund-policy) and [Privacy Policy](/privacy-policy) are part of these terms.

*[to confirm] Have these terms reviewed before going live.*
$md$)
on conflict (slug) do nothing;
