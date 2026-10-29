# 👗 WOMEN'S FASHION — DUMMY DATA CATALOGUE
> **Original Document Shared at Project Start**  
> *Two-page reference for testing billing software, product categories, item descriptions, and sample SKUs. All sample prices are illustrative INR values.*

---

## 1. Product Category Master

| Category ID | Main Category | Subcategory / Product Types | Typical Audience |
|---|---|---|---|
| **CAT001** | Indian Ethnic Wear | Saree; Salwar Suit; Anarkali; Kurti; Kurta Set; Lehenga Choli; Sharara; Gharara; Regional Wear | Kids, Teens, Adults, Mature |
| **CAT002** | Indo-Western / Fusion | Pre-draped Saree; Jacket Lehenga; Dhoti Pants Set; Fusion Dress; Ethnic Co-ord | Teens, Adults |
| **CAT003** | Western Casual Wear | T-shirt; Top; Shirt; Jeans; Trousers; Leggings; Shorts; Skirt; Jumpsuit; Co-ord Set | Kids, Teens, Adults |
| **CAT004** | Dresses & Gowns | Frock; Mini Dress; Midi Dress; Maxi Dress; A-line; Wrap; Shirt Dress; Bodycon; Evening Gown | Kids, Teens, Adults |
| **CAT005** | Office / Formal Wear | Blazer; Formal Shirt; Blouse; Tailored Trousers; Pencil Skirt; Formal Suit | Adults |
| **CAT006** | Party / Occasion Wear | Cocktail Dress; Sequin Outfit; Party Gown; Engagement Outfit; Reception Wear; Festive Wear | Kids, Teens, Adults |
| **CAT007** | Streetwear / Trendy | Oversized T-shirt; Hoodie; Cargo Pants; Graphic Tee; Joggers; Denim Jacket | Teens, Adults |
| **CAT008** | Sports / Athleisure | Sports Bra; Leggings; Track Pants; Sweatshirt; Yoga Wear; Gym Set | Teens, Adults |
| **CAT009** | Loungewear / Sleepwear | Pyjama Set; Night Suit; Nightgown; Robe; Lounge Co-ord | Kids, Teens, Adults |
| **CAT010** | Innerwear / Shapewear | Bra; Panty; Slip; Camisole; Shapewear | Teens, Adults |
| **CAT011** | Winterwear | Sweater; Cardigan; Coat; Jacket; Shawl; Thermal Wear | Kids, Teens, Adults |
| **CAT012** | Maternity / Nursing | Maternity Dress; Nursing Top; Maternity Leggings; Feeding Nightwear | Adults |
| **CAT013** | Modest Wear | Abaya; Long Tunic; Maxi Dress; Hijab; Modest Co-ord | Teens, Adults |
| **CAT014** | Swimwear | Swimsuit; Bikini; Cover-up; Beach Dress | Teens, Adults |
| **CAT015** | Accessories | Handbag; Belt; Scarf; Jewellery; Hair Accessory; Footwear | All age groups |

---

## 2. Age-Group Values for Product Records

| Age Group ID | Label | Suggested Range | Example Products |
|---|---|---|---|
| **AGE01** | Infant | 0–2 years | Rompers, onesies, baby frocks, bodysuits |
| **AGE02** | Little Girls | 2–8 years | Frocks, skirts, leggings, lehenga sets |
| **AGE03** | Preteen | 9–12 years | Casual tops, dresses, kurtis, festive sets |
| **AGE04** | Teen | 13–19 years | Jeans, tops, cargo pants, dresses, fusion wear |
| **AGE05** | Adult | 20–59 years | Office wear, sarees, dresses, suits, party wear |
| **AGE06** | Mature | 60+ years | Comfort kurtas, sarees, relaxed dresses, cardigans |

*Billing tip: Store age group as an optional filter, not as the only way to classify a product. A product can belong to several occasions or styles.*

---

## 3. Style & Product Attributes
*Use these controlled values as dropdown options or tags in your billing / inventory software.*

- **Culture / Wear Type**: Indian Ethnic; Western; Indo-Western; Regional Indian; Modest Wear
- **Occasion**: Daily Wear; Casual Outing; Office; College; Party; Wedding; Bridal; Engagement; Reception; Festival; Travel; Sports; Sleepwear
- **Fashion Aesthetic**: Minimalist; Elegant; Classic; Bohemian / Boho; Streetwear; Vintage; Retro; Quiet Luxury; Preppy; Romantic; Edgy; Glam; Sporty; Traditional
- **Garment Type**: Saree; Kurti; Suit; Lehenga; Top; T-shirt; Shirt; Jeans; Trousers; Skirt; Dress; Gown; Jumpsuit; Co-ord; Jacket; Nightwear
- **Fit**: Slim; Regular; Relaxed; Oversized; Straight; A-line; Flared; Fitted; Wide-leg
- **Fabric**: Cotton; Silk; Linen; Denim; Rayon; Georgette; Chiffon; Crepe; Satin; Velvet; Wool; Polyester; Organza; Net; Blend
- **Pattern / Work**: Solid; Floral; Striped; Checked; Printed; Embroidered; Sequined; Mirror Work; Block Print; Bandhani; Tie-Dye; Lace
- **Season**: Summer; Winter; Monsoon; All Season
- **Size Values**: 
  - Kids: `0–2Y`, `2–4Y`, `4–6Y`, `6–8Y`, `8–10Y`, `10–12Y`
  - Adult: `XS`, `S`, `M`, `L`, `XL`, `XXL`, `3XL`; numeric sizes where relevant
- **Color**: Black; White; Red; Blue; Navy; Green; Pink; Purple; Yellow; Orange; Beige; Brown; Grey; Gold; Silver; Multicolor

---

## 4. Sample Product Master — Dummy Inventory

| SKU | Product Name | Category | Size | Color | Fabric | MRP (₹) | Stock |
|---|---|---|---|---|---|---|---|
| **WET001** | Printed Cotton Kurti | Indian Ethnic | M | Blue | Cotton | ₹799 | 25 |
| **WET002** | Floral Anarkali Suit | Indian Ethnic | L | Pink | Rayon | ₹1,899 | 12 |
| **WET003** | Banarasi Style Saree | Indian Ethnic | Free | Maroon | Silk Blend | ₹2,499 | 8 |
| **WFW001** | High-Rise Wide-Leg Jeans | Western Casual | 30 | Blue | Denim | ₹1,499 | 18 |
| **WFW002** | Women's Linen Shirt | Office / Formal | M | White | Linen Blend | ₹1,199 | 15 |
| **WFW003** | Floral Midi Dress | Dresses | S | Yellow | Rayon | ₹1,399 | 10 |
| **WFW004** | Oversized Graphic T-shirt | Streetwear | L | Black | Cotton | ₹699 | 30 |
| **WFW005** | Women's Blazer | Office / Formal | M | Beige | Polyester Blend | ₹2,299 | 7 |
| **WOC001** | Sequin Party Gown | Party Wear | M | Black | Net / Lining | ₹3,499 | 5 |
| **WIF001** | Girls' Floral Frock | Kids Wear | 6–8Y | Pink | Cotton | ₹599 | 20 |
| **WIF002** | Girls' Lehenga Set | Kids Ethnic | 8–10Y | Red | Silk Blend | ₹1,499 | 6 |
| **WFW006** | Women's Lounge Co-ord | Loungewear | XL | Grey | Cotton Blend | ₹1,099 | 14 |
| **WSP001** | Athleisure Leggings | Sportswear | M | Black | Polyester / Elastane | ₹899 | 22 |
| **WAC001** | Everyday Tote Bag | Accessories | Free | Tan | PU | ₹999 | 11 |

---

## 5. Suggested Fields for Billing Software
- **Required**: SKU / Item Code, Product Name, Category, Selling Price, Tax Rate, Stock Quantity.
- **Useful Optional Fields**: Brand, Subcategory, Age Group, Culture, Style, Occasion, Size, Color, Fabric, Barcode, Cost Price, Discount, Supplier, Reorder Level, HSN / Tax Code.
