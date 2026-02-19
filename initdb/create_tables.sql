DROP TABLE IF EXISTS Review;
DROP VIEW IF EXISTS "View_User_Roles";

DROP TABLE IF EXISTS OrderHistory;
DROP TABLE IF EXISTS OrderItem;   
DROP TABLE IF EXISTS "Order";
DROP TABLE IF EXISTS Customer Cascade;

DROP TABLE IF EXISTS SiteManager;

DROP TABLE IF EXISTS Dish;
DROP TABLE IF EXISTS Menu;
DROP TABLE IF EXISTS Restaurant;
DROP TABLE IF EXISTS RestaurantOwner;

DROP INDEX IF EXISTS idx_login_history_user_email;
DROP TABLE IF EXISTS LogInHistory;

DROP TABLE IF EXISTS AppUser;






CREATE TABLE AppUser
(
  email varchar(100) PRIMARY KEY,
  password varchar(100) NOT NULL,
  firstname varchar(100),
  lastname varchar(100)
);

CREATE TABLE LogInHistory
(
  id SERIAL PRIMARY KEY,
  userEmail varchar(100),
  time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ipAddress varchar(45),
  status varchar(20) CHECK (status IN ('Success', 'Failure')),
  userAgent TEXT
);

CREATE INDEX idx_login_history_user_email ON public.LogInHistory(userEmail);

DROP TABLE IF EXISTS DeliveryZone;
CREATE TABLE DeliveryZone
(
  id char(1) PRIMARY KEY,
  isActive BOOLEAN NOT NULL DEFAULT 'true'
);

DROP TYPE IF EXISTS blocked_status;
CREATE TYPE blocked_status as ENUM('not-blocked', 'warned', 'blocked');
CREATE TABLE Customer
(
  email varchar(100) PRIMARY KEY REFERENCES public.AppUser(email),
  blockedStatus blocked_status,
  address varchar(100),
  postcode varchar(100),
  phoneNumber varchar(100),
  deliveryZone char(1),
  points INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT fk_delivery_zone
    FOREIGN KEY(deliveryZone) 
    REFERENCES deliveryZone(id) ON DELETE SET NULL
);

CREATE TABLE SiteManager
(
  email varchar(100) PRIMARY KEY REFERENCES public.AppUser(email)
);

CREATE TABLE RestaurantOwner
(
  email varchar(100) PRIMARY KEY REFERENCES public.AppUser(email)
);

DROP TYPE IF EXISTS approval_status;
CREATE TYPE approval_status as ENUM('pending', 'rejected', 'approved', 'suspended');
DROP TYPE IF EXISTS service_fee_type;
CREATE TYPE service_fee_type as ENUM('cents', 'percent');
CREATE TABLE restaurant
(
  id SERIAL PRIMARY KEY,
  name varchar(100) NOT NULL,
  ownerEmail varchar(100),
  approvalStatus approval_status,
  address varchar(100) NOT NULL,
  postcode varchar(100) NOT NULL,
  phoneNumber varchar(100) NOT NULL,

  cuisine varchar(50),
  openingHours varchar(100),
  deliveryZone char(1),
  
  CONSTRAINT fk_delivery_zone
    FOREIGN KEY(deliveryZone) 
    REFERENCES deliveryZone(id) ON DELETE SET NULL,

  serviceFee int CHECK(serviceFee >= 0),
  serviceFeeType service_fee_type,
  CONSTRAINT fee_requires_type
    CHECK (serviceFee IS NULL OR serviceFeeType IS NOT NULL)
);




CREATE TABLE Review
(
  reviewID SERIAL PRIMARY KEY,
  restaurantID int REFERENCES public.Restaurant(id),
  customerEmail varchar(100) REFERENCES public.Customer(email),
  timeStamp timeStamptz NOT NULL,
  rating int NOT NULL,
  description varchar(500)
);

CREATE TABLE Menu (
    menuID SERIAL PRIMARY KEY,
    restaurantID int REFERENCES public.Restaurant(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL,
    description varchar(255)
);

CREATE TABLE Dish (
    dishID SERIAL PRIMARY KEY,
    menuID int REFERENCES public.Menu(menuID) ON DELETE CASCADE,
    name varchar(100) NOT NULL,
    description varchar(255),
    price DECIMAL(10, 2) NOT NULL,
    photoLink varchar(255)
);

DROP TYPE IF EXISTS order_status;
CREATE TYPE order_status as ENUM('pending', 'accepted', 'rejected', 'preparing', 'ready', 'dispatched', 'delivered');
CREATE TABLE "Order" (
    orderID SERIAL PRIMARY KEY,
    customerEmail varchar(100) REFERENCES public.Customer(email),
    restaurantID int REFERENCES public.Restaurant(id),
    status order_status DEFAULT 'pending',
    discountCodes varchar(50),
    deliveryAddress varchar(255),
    deliveryOptions varchar(100),
    serviceFee int CHECK(serviceFee >= 0),
    serviceFeeType service_fee_type,
    CONSTRAINT fee_requires_type
      CHECK (serviceFee IS NULL OR serviceFeeType IS NOT NULL)
);

CREATE TABLE OrderItem (
    orderID int REFERENCES "Order"(orderID) ON DELETE CASCADE,
    dishID int REFERENCES Dish(dishID),
    quantity int NOT NULL DEFAULT 1,
    unitPrice DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (orderID, dishID)
);

CREATE TABLE OrderHistory
(
  id SERIAL PRIMARY KEY,
  orderID int NOT NULL REFERENCES "Order"(orderID) ON DELETE CASCADE,
  time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status order_status,
  changedBY varchar(100) NOT NULL REFERENCES public.AppUser(email)
);

DROP TABLE IF EXISTS ratings CASCADE;
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  customerEmail VARCHAR(100) NOT NULL,
  restaurantId INTEGER,
  dishId INTEGER,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    restaurantId IS NOT NULL
    OR dishId IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_restaurant_rating
ON ratings (customerEmail, restaurantId)
WHERE restaurantId IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_dish_rating
ON ratings (customerEmail, dishId)
WHERE dishId IS NOT NULL;

CREATE VIEW View_User_Roles AS
SELECT 
    u.email, 
    u.password,
    CASE 
        WHEN s.email IS NOT NULL THEN 'SiteManager'
        WHEN r.email IS NOT NULL THEN 'RestaurantOwner'
        WHEN c.email IS NOT NULL THEN 'Customer'
        ELSE 'Generic User'
    END AS role
FROM AppUser u
LEFT JOIN SiteManager s ON u.email = s.email
LEFT JOIN RestaurantOwner r ON u.email = r.email
LEFT JOIN Customer c ON u.email = c.email;

DROP TABLE IF EXISTS vouchers CASCADE;
CREATE TABLE vouchers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_percent INTEGER NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS LoyaltyRedemption (
    id SERIAL PRIMARY KEY,
    customerEmail VARCHAR(100)
        REFERENCES Customer(email)
        ON DELETE CASCADE,
    voucherCode VARCHAR(50) NOT NULL,
    pointsSpent INTEGER NOT NULL,
    redeemedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);