import Papa from 'papaparse';
import { schemaProfiler } from '../tools/schemaProfiler.js';
import { DatasetProfile } from '../schema/dataset.js';

export const TECH_SALES_CSV = `Order_ID,Date,Quarter,Region,Customer_Segment,Product_Category,Units_Sold,Unit_Price,Revenue,Discount_Pct,Cost,Customer_Satisfaction
ORD-2024025,2024-01-13,Q1,North America,Mid-Market,Cloud Infrastructure,3,1200.0,3600.0,0.0,1440.0,4.8
ORD-2024003,2024-01-23,Q1,Europe,Government,Analytics Suite,8,1500.0,12000.0,0.0,4160.0,4.2
ORD-2024078,2024-01-23,Q1,Latin America,Mid-Market,Cloud Infrastructure,15,1200.0,18000.0,0.0,7200.0,3.7
ORD-2024082,2024-01-25,Q1,Europe,Enterprise,AI Platform,34,2500.0,76500.0,0.1,32300.0,3.8
ORD-2024107,2024-01-26,Q1,Asia Pacific,SMB,AI Platform,7,2500.0,17500.0,0.0,6650.0,4.6
ORD-2024048,2024-01-31,Q1,Asia Pacific,Enterprise,Cybersecurity,28,1800.0,45360.0,0.1,17360.0,4.5
ORD-2024135,2024-02-02,Q1,North America,SMB,Cybersecurity,6,1800.0,10260.0,0.05,3720.0,4.2
ORD-2024016,2024-02-11,Q1,Latin America,Government,DevOps Tools,17,950.0,16150.0,0.0,5270.0,4.0
ORD-2024012,2024-02-12,Q1,Asia Pacific,Mid-Market,AI Platform,16,2500.0,38000.0,0.05,15200.0,4.8
ORD-2024026,2024-02-15,Q1,Europe,SMB,Analytics Suite,8,1500.0,12000.0,0.0,4160.0,4.4
ORD-2024065,2024-02-16,Q1,Latin America,Mid-Market,DevOps Tools,13,950.0,11732.5,0.05,4030.0,4.2
ORD-2024031,2024-02-17,Q1,North America,Enterprise,DevOps Tools,28,950.0,25270.0,0.05,8680.0,4.9
ORD-2024015,2024-02-25,Q1,North America,Mid-Market,Cloud Infrastructure,6,1200.0,6480.0,0.1,2880.0,4.2
ORD-2024134,2024-02-25,Q1,North America,Enterprise,DevOps Tools,30,950.0,24225.0,0.15,9300.0,4.9
ORD-2024121,2024-02-26,Q1,North America,Government,AI Platform,4,2500.0,10000.0,0.0,3800.0,4.5
ORD-2024105,2024-02-29,Q1,Europe,SMB,AI Platform,1,2500.0,2500.0,0.0,950.0,3.9
ORD-2024008,2024-03-01,Q1,Asia Pacific,Government,DevOps Tools,12,950.0,11400.0,0.0,3720.0,3.8
ORD-2024130,2024-03-01,Q1,North America,Government,DevOps Tools,1,950.0,950.0,0.0,310.0,4.6
ORD-2024115,2024-03-03,Q1,Asia Pacific,Government,AI Platform,16,2500.0,40000.0,0.0,15200.0,4.0
ORD-2024019,2024-03-04,Q1,Europe,Mid-Market,Cybersecurity,12,1800.0,21600.0,0.0,7440.0,4.4
ORD-2024056,2024-03-09,Q1,Europe,SMB,DevOps Tools,1,950.0,902.5,0.05,310.0,3.6
ORD-2024058,2024-03-13,Q1,Asia Pacific,Government,Cybersecurity,11,1800.0,19800.0,0.0,6820.0,4.2
ORD-2024100,2024-03-14,Q1,North America,Enterprise,DevOps Tools,38,950.0,28880.0,0.2,11780.0,4.3
ORD-2024077,2024-03-15,Q1,North America,Government,Analytics Suite,19,1500.0,28500.0,0.0,9880.0,4.4
ORD-2024030,2024-03-21,Q1,Europe,SMB,DevOps Tools,7,950.0,6650.0,0.0,2170.0,4.8
ORD-2024066,2024-03-25,Q1,North America,Government,Cloud Infrastructure,8,1200.0,9600.0,0.0,3840.0,3.8
ORD-2024122,2024-03-28,Q1,Asia Pacific,SMB,DevOps Tools,7,950.0,6317.5,0.05,2170.0,5.0
ORD-2024018,2024-03-30,Q1,North America,SMB,DevOps Tools,8,950.0,7600.0,0.0,2480.0,4.3
ORD-2024069,2024-03-31,Q1,Latin America,SMB,DevOps Tools,4,950.0,3610.0,0.05,1240.0,4.7
ORD-2024084,2024-04-04,Q2,North America,Mid-Market,Analytics Suite,10,1500.0,15000.0,0.0,5200.0,4.4
ORD-2024063,2024-04-05,Q2,Asia Pacific,SMB,Cloud Infrastructure,1,1200.0,1200.0,0.0,480.0,4.5
ORD-2024060,2024-04-08,Q2,Asia Pacific,Government,Analytics Suite,18,1500.0,27000.0,0.0,9360.0,4.8
ORD-2024113,2024-04-08,Q2,Latin America,SMB,DevOps Tools,3,950.0,2707.5,0.05,930.0,4.5
ORD-2024050,2024-04-09,Q2,North America,Mid-Market,DevOps Tools,11,950.0,9927.5,0.05,3410.0,4.7
ORD-2024039,2024-04-23,Q2,Europe,SMB,Cybersecurity,6,1800.0,10800.0,0.0,3720.0,4.5
ORD-2024041,2024-04-28,Q2,Asia Pacific,Mid-Market,Analytics Suite,12,1500.0,18000.0,0.0,6240.0,4.8
ORD-2024005,2024-04-29,Q2,North America,Enterprise,Cybersecurity,26,1800.0,39780.0,0.15,16120.0,4.8
ORD-2024095,2024-05-02,Q2,Europe,SMB,DevOps Tools,9,950.0,8122.5,0.05,2790.0,4.3
ORD-2024024,2024-05-04,Q2,Asia Pacific,Enterprise,Cloud Infrastructure,46,1200.0,49680.0,0.1,22080.0,4.4
ORD-2024064,2024-05-04,Q2,Europe,Enterprise,AI Platform,19,2500.0,38000.0,0.2,18050.0,4.5
ORD-2024112,2024-05-06,Q2,North America,SMB,Analytics Suite,9,1500.0,13500.0,0.0,4680.0,4.7
ORD-2024072,2024-05-07,Q2,Europe,Mid-Market,DevOps Tools,3,950.0,2707.5,0.05,930.0,4.2
ORD-2024097,2024-05-07,Q2,Europe,SMB,Cloud Infrastructure,2,1200.0,2400.0,0.0,960.0,3.9
ORD-2024071,2024-05-09,Q2,Asia Pacific,SMB,Cybersecurity,9,1800.0,16200.0,0.0,5580.0,3.8
ORD-2024032,2024-05-10,Q2,Latin America,Government,AI Platform,16,2500.0,40000.0,0.0,15200.0,3.9
ORD-2024021,2024-05-12,Q2,North America,Enterprise,Analytics Suite,28,1500.0,37800.0,0.1,14560.0,3.8
ORD-2024094,2024-05-12,Q2,Latin America,Government,DevOps Tools,1,950.0,950.0,0.0,310.0,3.7
ORD-2024123,2024-05-13,Q2,Europe,Government,DevOps Tools,7,950.0,6650.0,0.0,2170.0,4.9
ORD-2024010,2024-05-14,Q2,Latin America,Government,AI Platform,9,2500.0,22500.0,0.0,8550.0,5.0
ORD-2024136,2024-05-14,Q2,Latin America,Mid-Market,Analytics Suite,6,1500.0,9000.0,0.0,3120.0,3.7
ORD-2024051,2024-05-16,Q2,Europe,Enterprise,Cybersecurity,24,1800.0,34560.0,0.2,14880.0,3.9
ORD-2024103,2024-05-16,Q2,Latin America,Mid-Market,Cloud Infrastructure,17,1200.0,19380.0,0.05,8160.0,4.2
ORD-2024045,2024-05-17,Q2,North America,Government,Cloud Infrastructure,9,1200.0,10800.0,0.0,4320.0,3.7
ORD-2024034,2024-05-24,Q2,Asia Pacific,Government,DevOps Tools,18,950.0,17100.0,0.0,5580.0,4.5
ORD-2024108,2024-05-24,Q2,Europe,Government,Analytics Suite,4,1500.0,6000.0,0.0,2080.0,4.4
ORD-2024004,2024-05-31,Q2,Europe,Government,Cloud Infrastructure,11,1200.0,13200.0,0.0,5280.0,4.0
ORD-2024059,2024-06-09,Q2,Europe,Mid-Market,Analytics Suite,14,1500.0,18900.0,0.1,7280.0,4.9
ORD-2024075,2024-06-10,Q2,Latin America,Mid-Market,DevOps Tools,16,950.0,15200.0,0.0,4960.0,4.0
ORD-2024040,2024-06-11,Q2,Asia Pacific,Enterprise,DevOps Tools,25,950.0,22562.5,0.05,7750.0,3.7
ORD-2024099,2024-06-12,Q2,Europe,SMB,Cloud Infrastructure,1,1200.0,1200.0,0.0,480.0,4.4
ORD-2024140,2024-06-12,Q2,Latin America,Government,AI Platform,4,2500.0,10000.0,0.0,3800.0,3.9
ORD-2024061,2024-06-13,Q2,Europe,Government,Cybersecurity,19,1800.0,34200.0,0.0,11780.0,4.4
ORD-2024085,2024-06-17,Q2,Latin America,Government,Analytics Suite,7,1500.0,10500.0,0.0,3640.0,3.7
ORD-2024062,2024-06-22,Q2,Latin America,Government,DevOps Tools,7,950.0,6650.0,0.0,2170.0,4.3
ORD-2024127,2024-06-22,Q2,Europe,Government,AI Platform,8,2500.0,20000.0,0.0,7600.0,4.8
ORD-2024117,2024-06-23,Q2,Latin America,Enterprise,Cloud Infrastructure,42,1200.0,40320.0,0.2,20160.0,3.7
ORD-2024046,2024-06-28,Q2,Asia Pacific,Mid-Market,AI Platform,15,2500.0,33750.0,0.1,14250.0,4.6
ORD-2024101,2024-07-02,Q3,North America,SMB,AI Platform,8,2500.0,20000.0,0.0,7600.0,4.8
ORD-2024009,2024-07-09,Q3,Asia Pacific,Enterprise,AI Platform,50,2500.0,112500.0,0.1,47500.0,4.3
ORD-2024049,2024-07-09,Q3,Latin America,Mid-Market,Analytics Suite,8,1500.0,12000.0,0.0,4160.0,5.0
ORD-2024092,2024-07-09,Q3,Asia Pacific,SMB,Cybersecurity,10,1800.0,17100.0,0.05,6200.0,4.4
ORD-2024088,2024-07-13,Q3,Europe,Government,DevOps Tools,6,950.0,5700.0,0.0,1860.0,4.6
ORD-2024042,2024-07-17,Q3,Europe,Government,Cybersecurity,18,1800.0,32400.0,0.0,11160.0,4.6
ORD-2024079,2024-07-22,Q3,Europe,Government,Cybersecurity,11,1800.0,19800.0,0.0,6820.0,4.1
ORD-2024080,2024-07-22,Q3,Latin America,SMB,Cybersecurity,1,1800.0,1710.0,0.05,620.0,3.6
ORD-2024137,2024-07-23,Q3,Europe,Government,Analytics Suite,19,1500.0,28500.0,0.0,9880.0,3.8
ORD-2024132,2024-07-31,Q3,Asia Pacific,Government,Cloud Infrastructure,11,1200.0,13200.0,0.0,5280.0,4.5
ORD-2024053,2024-08-01,Q3,Asia Pacific,Enterprise,Cybersecurity,30,1800.0,43200.0,0.2,18600.0,4.6
ORD-2024033,2024-08-02,Q3,Europe,Government,Cloud Infrastructure,1,1200.0,1200.0,0.0,480.0,5.0
ORD-2024102,2024-08-02,Q3,North America,Enterprise,DevOps Tools,19,950.0,15342.5,0.15,5890.0,3.7
ORD-2024116,2024-08-02,Q3,North America,Government,Analytics Suite,3,1500.0,4500.0,0.0,1560.0,4.0
ORD-2024131,2024-08-06,Q3,North America,Government,AI Platform,9,2500.0,22500.0,0.0,8550.0,4.1
ORD-2024128,2024-08-07,Q3,Asia Pacific,Government,Cloud Infrastructure,13,1200.0,15600.0,0.0,6240.0,4.1
ORD-2024104,2024-08-23,Q3,Latin America,SMB,Cybersecurity,9,1800.0,16200.0,0.0,5580.0,4.5
ORD-2024126,2024-08-25,Q3,Latin America,SMB,Analytics Suite,5,1500.0,7125.0,0.05,2600.0,4.2
ORD-2024052,2024-09-01,Q3,Asia Pacific,Mid-Market,Cybersecurity,8,1800.0,14400.0,0.0,4960.0,4.5
ORD-2024138,2024-09-02,Q3,Latin America,SMB,Cybersecurity,1,1800.0,1710.0,0.05,620.0,4.9
ORD-2024022,2024-09-09,Q3,Europe,SMB,Analytics Suite,8,1500.0,11400.0,0.05,4160.0,5.0
ORD-2024098,2024-09-13,Q3,Asia Pacific,Enterprise,Cybersecurity,26,1800.0,42120.0,0.1,16120.0,4.1
ORD-2024076,2024-09-14,Q3,Latin America,SMB,Cloud Infrastructure,6,1200.0,7200.0,0.0,2880.0,4.8
ORD-2024035,2024-09-15,Q3,Europe,SMB,AI Platform,3,2500.0,7500.0,0.0,2850.0,4.4
ORD-2024133,2024-09-15,Q3,North America,Enterprise,Analytics Suite,38,1500.0,48450.0,0.15,19760.0,5.0
ORD-2024114,2024-09-17,Q3,Latin America,SMB,Cloud Infrastructure,7,1200.0,7980.0,0.05,3360.0,4.0
ORD-2024111,2024-09-18,Q3,North America,Enterprise,DevOps Tools,34,950.0,27455.0,0.15,10540.0,3.6
ORD-2024125,2024-09-25,Q3,North America,SMB,Cybersecurity,5,1800.0,8550.0,0.05,3100.0,4.8
ORD-2024037,2024-09-26,Q3,Europe,Enterprise,Cloud Infrastructure,32,1200.0,34560.0,0.1,15360.0,4.2
ORD-2024124,2024-09-26,Q3,North America,SMB,AI Platform,7,2500.0,16625.0,0.05,6650.0,4.9
ORD-2024093,2024-09-30,Q3,North America,Mid-Market,AI Platform,14,2500.0,33250.0,0.05,13300.0,4.4
ORD-2024067,2024-10-01,Q4,Europe,Enterprise,AI Platform,29,2500.0,58000.0,0.2,27550.0,4.5
ORD-2024118,2024-10-01,Q4,Latin America,Government,Cybersecurity,2,1800.0,3600.0,0.0,1240.0,3.9
ORD-2024070,2024-10-02,Q4,Asia Pacific,Government,DevOps Tools,3,950.0,2850.0,0.0,930.0,4.6
ORD-2024020,2024-10-07,Q4,Latin America,Enterprise,Cloud Infrastructure,25,1200.0,25500.0,0.15,12000.0,3.9
ORD-2024096,2024-10-07,Q4,Asia Pacific,SMB,Cybersecurity,7,1800.0,11970.0,0.05,4340.0,4.0
ORD-2024054,2024-10-10,Q4,North America,SMB,Cybersecurity,3,1800.0,5130.0,0.05,1860.0,3.7
ORD-2024057,2024-10-11,Q4,North America,SMB,AI Platform,10,2500.0,23750.0,0.05,9500.0,4.5
ORD-2024023,2024-10-12,Q4,Latin America,SMB,AI Platform,7,2500.0,16625.0,0.05,6650.0,3.8
ORD-2024081,2024-10-12,Q4,Asia Pacific,Mid-Market,Cloud Infrastructure,3,1200.0,3240.0,0.1,1440.0,3.7
ORD-2024036,2024-10-13,Q4,North America,Enterprise,Cloud Infrastructure,44,1200.0,47520.0,0.1,21120.0,3.7
ORD-2024073,2024-10-13,Q4,Europe,Government,DevOps Tools,13,950.0,12350.0,0.0,4030.0,4.9
ORD-2024002,2024-10-15,Q4,North America,Enterprise,Cloud Infrastructure,19,1200.0,20520.0,0.1,9120.0,4.3
ORD-2024139,2024-10-15,Q4,Asia Pacific,SMB,AI Platform,7,2500.0,16625.0,0.05,6650.0,4.2
ORD-2024119,2024-10-17,Q4,Latin America,Government,AI Platform,4,2500.0,10000.0,0.0,3800.0,3.6
ORD-2024106,2024-10-18,Q4,Latin America,Government,AI Platform,20,2500.0,50000.0,0.0,19000.0,4.3
ORD-2024017,2024-10-19,Q4,North America,SMB,Cloud Infrastructure,5,1200.0,6000.0,0.0,2400.0,4.0
ORD-2024044,2024-10-19,Q4,Europe,SMB,AI Platform,3,2500.0,7125.0,0.05,2850.0,4.3
ORD-2024068,2024-10-22,Q4,Latin America,Government,AI Platform,18,2500.0,45000.0,0.0,17100.0,4.2
ORD-2024047,2024-10-23,Q4,Europe,Enterprise,AI Platform,40,2500.0,90000.0,0.1,38000.0,4.2
ORD-2024038,2024-10-27,Q4,North America,Enterprise,AI Platform,42,2500.0,89250.0,0.15,39900.0,4.9
ORD-2024091,2024-10-27,Q4,Asia Pacific,Enterprise,Analytics Suite,36,1500.0,48600.0,0.1,18720.0,4.3
ORD-2024110,2024-10-27,Q4,Latin America,SMB,Cybersecurity,6,1800.0,10260.0,0.05,3720.0,4.3
ORD-2024027,2024-10-28,Q4,Latin America,Government,Analytics Suite,7,1500.0,10500.0,0.0,3640.0,3.7
ORD-2024014,2024-11-04,Q4,Latin America,SMB,DevOps Tools,4,950.0,3800.0,0.0,1240.0,4.3
ORD-2024074,2024-11-04,Q4,Latin America,Government,Cloud Infrastructure,1,1200.0,1200.0,0.0,480.0,4.9
ORD-2024090,2024-11-08,Q4,Europe,Enterprise,AI Platform,33,2500.0,74250.0,0.1,31350.0,4.7
ORD-2024055,2024-11-10,Q4,Asia Pacific,Government,AI Platform,20,2500.0,50000.0,0.0,19000.0,5.0
ORD-2024006,2024-11-14,Q4,Latin America,Enterprise,Cybersecurity,25,1800.0,38250.0,0.15,15500.0,4.8
ORD-2024043,2024-11-18,Q4,Asia Pacific,Enterprise,AI Platform,23,2500.0,54625.0,0.05,21850.0,4.8
ORD-2024007,2024-11-21,Q4,North America,Enterprise,Cybersecurity,27,1800.0,46170.0,0.05,16740.0,4.8
ORD-2024086,2024-11-26,Q4,Asia Pacific,Enterprise,AI Platform,30,2500.0,63750.0,0.15,28500.0,4.3
ORD-2024120,2024-11-27,Q4,Europe,SMB,Analytics Suite,9,1500.0,13500.0,0.0,4680.0,4.4
ORD-2024001,2024-12-02,Q4,Asia Pacific,Mid-Market,AI Platform,8,2500.0,20000.0,0.0,7600.0,4.6
ORD-2024011,2024-12-02,Q4,Asia Pacific,Enterprise,AI Platform,19,2500.0,40375.0,0.15,18050.0,4.2
ORD-2024013,2024-12-04,Q4,Europe,Mid-Market,AI Platform,18,2500.0,40500.0,0.1,17100.0,4.0
ORD-2024029,2024-12-05,Q4,Asia Pacific,Enterprise,AI Platform,24,2500.0,54000.0,0.1,22800.0,4.4
ORD-2024109,2024-12-06,Q4,Europe,Enterprise,AI Platform,17,2500.0,36125.0,0.15,16150.0,4.4
ORD-2024089,2024-12-08,Q4,Latin America,Government,Cybersecurity,14,1800.0,25200.0,0.0,8680.0,4.8
ORD-2024028,2024-12-12,Q4,Latin America,Government,AI Platform,2,2500.0,5000.0,0.0,1900.0,4.5
ORD-2024087,2024-12-13,Q4,Asia Pacific,Enterprise,AI Platform,39,2500.0,92625.0,0.05,37050.0,4.2
ORD-2024129,2024-12-14,Q4,North America,Mid-Market,AI Platform,17,2500.0,38250.0,0.1,16150.0,4.1
ORD-2024083,2024-12-17,Q4,Europe,Government,Cloud Infrastructure,9,1200.0,10800.0,0.0,4320.0,4.7`;

export const ECOMMERCE_ORDERS_CSV = `Order_ID,Date,Country,Category,Sub_Category,Quantity,Sales,Profit,Shipping_Mode
ECOM-5022,2024-02-01,France,Furniture,Bookcases,1,156.13,36.37,First Class
ECOM-5043,2024-02-10,United Kingdom,Office Supplies,Pens,10,327.59,45.1,Same Day
ECOM-5063,2024-02-10,United Kingdom,Furniture,Tables,2,455.77,59.47,Same Day
ECOM-5100,2024-02-10,Canada,Furniture,Desks,1,219.85,34.72,Second Class
ECOM-5040,2024-02-11,United Kingdom,Office Supplies,Pens,6,242.25,59.61,Second Class
ECOM-5057,2024-02-12,United States,Office Supplies,Storage,4,157.22,46.37,Second Class
ECOM-5095,2024-02-17,United Kingdom,Electronics,Smartphones,5,2276.04,239.46,Standard Class
ECOM-5058,2024-03-08,United States,Electronics,Accessories,6,2462.12,714.35,Same Day
ECOM-5008,2024-03-13,Germany,Electronics,Laptops,3,1138.45,347.13,Standard Class
ECOM-5075,2024-03-17,Germany,Furniture,Bookcases,10,2296.91,235.75,Same Day
ECOM-5048,2024-03-18,United Kingdom,Furniture,Desks,6,1145.66,251.52,Second Class
ECOM-5069,2024-03-21,United States,Electronics,Headphones,3,1313.61,258.17,First Class
ECOM-5041,2024-04-04,Germany,Electronics,Laptops,5,2250.17,391.38,Same Day
ECOM-5010,2024-04-05,United Kingdom,Electronics,Accessories,8,2672.73,537.26,Same Day
ECOM-5089,2024-04-06,United Kingdom,Furniture,Tables,3,512.01,118.23,First Class
ECOM-5006,2024-04-07,Canada,Office Supplies,Binders,10,377.17,42.56,Second Class
ECOM-5066,2024-04-07,Germany,Furniture,Chairs,1,149.14,18.03,Second Class
ECOM-5088,2024-04-07,United Kingdom,Furniture,Tables,5,940.23,124.33,Standard Class
ECOM-5001,2024-04-09,United States,Office Supplies,Storage,4,162.35,25.58,First Class
ECOM-5031,2024-04-10,France,Furniture,Chairs,10,1784.61,295.15,Standard Class
ECOM-5012,2024-04-15,Canada,Electronics,Accessories,5,1582.84,228.58,First Class
ECOM-5035,2024-04-17,France,Furniture,Chairs,2,444.55,136.15,Standard Class
ECOM-5094,2024-04-20,Germany,Office Supplies,Paper,4,173.17,43.6,Second Class
ECOM-5039,2024-04-23,Canada,Furniture,Bookcases,10,2384.13,286.2,Same Day
ECOM-5033,2024-04-28,United Kingdom,Electronics,Smartphones,4,1796.5,232.27,First Class
ECOM-5028,2024-05-05,Germany,Office Supplies,Storage,10,457.31,125.73,Same Day
ECOM-5072,2024-05-05,Germany,Electronics,Headphones,8,2663.83,434.84,First Class
ECOM-5013,2024-05-06,United States,Office Supplies,Binders,5,152.31,46.54,First Class
ECOM-5052,2024-05-07,United States,Electronics,Headphones,6,2646.57,485.77,Standard Class
ECOM-5055,2024-05-12,Germany,Office Supplies,Storage,3,127.89,29.76,Standard Class
ECOM-5084,2024-05-12,Canada,Furniture,Tables,1,216.14,40.16,Standard Class
ECOM-5045,2024-05-14,Canada,Electronics,Laptops,7,1966.35,660.5,Second Class
ECOM-5049,2024-05-14,Canada,Electronics,Smartphones,4,1720.99,215.32,Second Class
ECOM-5005,2024-05-15,United Kingdom,Office Supplies,Storage,1,33.66,3.43,Standard Class
ECOM-5067,2024-05-15,United States,Office Supplies,Paper,1,30.55,5.5,Standard Class
ECOM-5023,2024-05-16,United Kingdom,Furniture,Desks,9,2058.9,434.49,Same Day
ECOM-5003,2024-05-19,Canada,Furniture,Desks,6,1396.87,440.54,Same Day
ECOM-5044,2024-05-19,Canada,Office Supplies,Binders,3,117.02,40.71,First Class
ECOM-5073,2024-05-28,France,Electronics,Accessories,6,2323.1,698.08,First Class
ECOM-5021,2024-05-29,Germany,Furniture,Tables,7,1569.72,496.92,First Class
ECOM-5036,2024-05-29,France,Electronics,Smartphones,3,1062.96,314.18,Second Class
ECOM-5087,2024-06-01,France,Office Supplies,Paper,1,35.72,6.37,Standard Class
ECOM-5076,2024-06-03,United Kingdom,Electronics,Laptops,1,320.97,106.98,Second Class
ECOM-5018,2024-06-11,Germany,Electronics,Headphones,6,2673.14,623.67,First Class
ECOM-5070,2024-06-20,United States,Furniture,Tables,5,1178.39,332.07,Standard Class
ECOM-5068,2024-06-26,Canada,Office Supplies,Pens,3,136.79,41.69,Same Day
ECOM-5071,2024-06-28,France,Furniture,Chairs,5,975.67,128.89,Same Day
ECOM-5032,2024-06-29,Canada,Office Supplies,Paper,1,35.19,5.54,Same Day
ECOM-5053,2024-06-29,Canada,Electronics,Smartphones,1,346.19,114.69,First Class
ECOM-5020,2024-07-01,Canada,Office Supplies,Binders,6,168.54,31.82,Second Class
ECOM-5078,2024-07-02,Germany,Furniture,Chairs,6,880.29,272.34,First Class
ECOM-5099,2024-07-05,Germany,Electronics,Smartphones,7,3018.94,498.32,Standard Class
ECOM-5024,2024-07-07,United States,Office Supplies,Pens,4,174.1,60.91,Standard Class
ECOM-5037,2024-07-07,Canada,Office Supplies,Paper,6,269.99,56.44,Standard Class
ECOM-5016,2024-07-10,Canada,Office Supplies,Binders,5,151.1,41.09,Second Class
ECOM-5061,2024-07-16,France,Furniture,Desks,2,488.95,75.75,Standard Class
ECOM-5026,2024-07-18,Canada,Electronics,Smartphones,7,3120.2,518.58,Second Class
ECOM-5097,2024-07-18,France,Furniture,Tables,3,656.01,70.83,First Class
ECOM-5042,2024-07-21,United Kingdom,Electronics,Laptops,6,1886.58,511.05,Standard Class
ECOM-5060,2024-07-26,United States,Furniture,Bookcases,9,2174.99,360.41,First Class
ECOM-5086,2024-07-30,Canada,Furniture,Bookcases,5,776.75,117.25,Standard Class
ECOM-5092,2024-07-31,France,Office Supplies,Paper,6,238.75,31.57,Standard Class
ECOM-5027,2024-08-03,United Kingdom,Office Supplies,Storage,7,278.6,77.66,Second Class
ECOM-5054,2024-08-05,United States,Furniture,Tables,1,206.34,35.87,Second Class
ECOM-5059,2024-08-08,Germany,Electronics,Smartphones,2,850.59,291.89,Same Day
ECOM-5038,2024-08-11,United States,Electronics,Smartphones,9,3901.01,402.33,Second Class
ECOM-5056,2024-08-13,United States,Electronics,Headphones,4,1238.55,148.11,First Class
ECOM-5051,2024-08-21,France,Electronics,Accessories,9,2948.6,814.54,Standard Class
ECOM-5014,2024-08-23,Germany,Electronics,Laptops,6,1952.57,390.08,Same Day
ECOM-5015,2024-08-23,Germany,Office Supplies,Paper,3,139.41,46.11,Second Class
ECOM-5011,2024-08-28,United States,Electronics,Accessories,10,4435.78,610.41,Standard Class
ECOM-5082,2024-09-11,United States,Electronics,Laptops,10,4046.33,559.22,Standard Class
ECOM-5017,2024-09-12,Germany,Office Supplies,Pens,8,350.25,42.04,First Class
ECOM-5019,2024-09-13,Canada,Office Supplies,Binders,5,179.79,48.47,Same Day
ECOM-5062,2024-09-15,France,Office Supplies,Pens,10,411.22,62.98,Standard Class
ECOM-5047,2024-09-16,United States,Electronics,Laptops,9,3268.11,1137.09,Second Class
ECOM-5093,2024-09-18,Canada,Electronics,Laptops,4,1728.42,575.63,Same Day
ECOM-5065,2024-09-20,Germany,Office Supplies,Storage,4,117.72,39.0,First Class
ECOM-5002,2024-10-08,Canada,Furniture,Bookcases,9,1961.15,460.2,Same Day
ECOM-5090,2024-10-09,Canada,Office Supplies,Storage,2,91.18,17.0,Same Day
ECOM-5096,2024-10-13,Canada,Furniture,Chairs,4,822.06,256.58,First Class
ECOM-5007,2024-10-15,Canada,Furniture,Bookcases,10,2438.83,352.18,Standard Class
ECOM-5091,2024-10-17,United States,Furniture,Chairs,8,1912.07,306.73,Second Class
ECOM-5064,2024-10-18,Canada,Furniture,Bookcases,7,1608.28,464.23,Standard Class
ECOM-5098,2024-10-20,United Kingdom,Furniture,Desks,7,1730.83,287.29,Same Day
ECOM-5050,2024-10-22,France,Office Supplies,Binders,3,136.98,22.48,Standard Class
ECOM-5009,2024-10-25,Germany,Electronics,Headphones,10,2811.9,512.96,Second Class
ECOM-5029,2024-10-25,United States,Furniture,Desks,2,402.84,140.71,Standard Class
ECOM-5004,2024-10-28,United States,Furniture,Desks,10,1805.91,608.08,Same Day
ECOM-5079,2024-11-04,France,Furniture,Chairs,8,1712.49,278.33,First Class
ECOM-5085,2024-11-05,Germany,Electronics,Laptops,8,2896.89,917.97,First Class
ECOM-5080,2024-11-10,Canada,Electronics,Headphones,3,867.1,157.18,Second Class
ECOM-5083,2024-11-10,United Kingdom,Furniture,Tables,9,1580.69,301.49,Standard Class
ECOM-5077,2024-11-11,Canada,Electronics,Accessories,5,2143.48,307.18,Standard Class
ECOM-5081,2024-11-12,Canada,Furniture,Bookcases,8,1981.9,497.33,First Class
ECOM-5034,2024-11-13,Canada,Furniture,Tables,2,408.9,61.16,First Class
ECOM-5030,2024-11-18,France,Office Supplies,Storage,2,70.1,19.87,First Class
ECOM-5074,2024-11-20,United States,Furniture,Chairs,4,816.1,241.03,First Class
ECOM-5025,2024-11-21,United Kingdom,Electronics,Smartphones,5,1787.69,427.81,Second Class
ECOM-5046,2024-11-23,Germany,Furniture,Tables,1,250.83,41.05,Second Class`;

export const BUNDLED_SAMPLES: Record<string, { filename: string; csv: string }> = {
  tech_sales_2024: {
    filename: 'tech_sales_2024.csv',
    csv: TECH_SALES_CSV,
  },
  ecommerce_orders: {
    filename: 'ecommerce_orders.csv',
    csv: ECOMMERCE_ORDERS_CSV,
  },
};

export function parseBundledSample(sampleKey: 'tech_sales_2024' | 'ecommerce_orders' | string) {
  const sample = BUNDLED_SAMPLES[sampleKey] || BUNDLED_SAMPLES['tech_sales_2024'];
  const parsed = Papa.parse<Record<string, any>>(sample.csv, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  });

  const rows = parsed.data;
  const datasetId = `sample_${sampleKey}_${Date.now()}`;
  const profile = schemaProfiler.execute({
    datasetId,
    filename: sample.filename,
    rows,
  });

  return { datasetId, filename: sample.filename, rows, profile };
}
