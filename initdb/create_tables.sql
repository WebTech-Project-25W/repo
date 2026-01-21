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

DROP TYPE IF EXISTS blocked_status;
CREATE TYPE blocked_status as ENUM('not-blocked', 'warned', 'blocked');
CREATE TABLE Customer
(
  email varchar(100) PRIMARY KEY REFERENCES public.AppUser(email),
  blockedStatus blocked_status,
  address varchar(100),
  postcode varchar(100),
  phoneNumber varchar(100),
  deliveryZone char(1) CHECK (deliveryZone IN ('A','B','C'))
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
  deliveryZone char(1) CHECK (deliveryZone IN ('A','B','C'))
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
    deliveryOptions varchar(100)
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




-- INSERT INTO AppUser (email, password, firstname, lastname)
-- VALUES 
--     ('admin', 'admin', NULL, NULL),
--     ('RO1', 'passRO1', NULL, NULL),
--     ('RO2', 'passRO2', NULL, NULL),
--     ('Amy@abc.com', 'passA', 'Amy', 'Peterson'),
--     ('Brian@bobble.co.uk', 'passB', 'Brian', 'Benderson'),
--     ('Cam@cambridge.edu.uk', 'passC', 'Cameron', 'Charleston'),
--     ('Dan@deven.at', 'passD', 'Daniel', 'Dealy'),
--     ('Emily@Ely.fr', 'passE', 'Emily', 'Ellington');

-- INSERT INTO SiteManager (email)
-- VALUES
--   ('admin');

-- INSERT INTO Customer (email, blockedStatus, address, postcode, phoneNumber)
-- VALUES 
--     ('Amy@abc.com', 'not-blocked', '1 Florabella Villas, Chalfont St Giles', 'HP8 4PE', '(01494) 048820'),
--     ('Brian@bobble.co.uk', 'not-blocked', '46 Beatrice Avenue, Saltash', 'PL12 4NG', '(01752) 645533'),
--     ('Cam@cambridge.edu.uk', 'not-blocked', 'The Conifers, Sodyllt Bank, Dudleston', 'SY12 9EJ', '(01978) 664871'),
--     ('Dan@deven.at', 'warned', 'Apartment 7, The Colmore, 36 - 37 Cox Street, Birmingham', 'B3 1RZ', '(0121) 476 5706'),
--     ('Emily@Ely.fr', 'blocked', '14 Stour Road, Grays', 'RM16 4BS', '(01375) 257756');

-- INSERT INTO RestaurantOwner (email)
-- VALUES
--   ('RO1'),
--   ('RO2');

-- INSERT INTO Restaurant (restaurantName, restaurantOwnerEmail, approvalStatus, address, postcode, phoneNumber)
-- VALUES
--   ('Resto1', 'RO1', 'pending', 'Loiblziele', 'OL9 8NT', '(01788) 471434'),
--   ('YumYumHouse', 'RO1', 'approved', '54 Whinfield Terrace, Rowlands Gill', 'NE39 2JY', '(01484) 387035'),
--   ('Eatery', 'RO1', 'rejected', '12 Bridle Close, Hoddesdon', 'EN11 9QA', '(01233) 416101'),
--   ('ScranFud', 'RO2', 'pending', '1 Oldham Square, New Mills', 'SK22 4BZ', '(01757) 667027'),
--   ('Nutri', 'RO2', 'approved', 'Flat 102, Russell Court, Woburn Place, London', 'WC1H 0LP', '(01708) 308411');

-- INSERT INTO Review(restaurantID, customerEmail, timeStamp, rating, description)
-- VALUES
--   (1, 'Amy@abc.com', '2025-12-01 18:30:00+01', 5, 'Best Tafelspitz I have ever had in Vienna!'),
--   (2, 'Brian@bobble.co.uk', '2025-12-05 12:45:00+00', 4, 'Lovely atmosphere, though the service was a bit slow today.'),
--   (1, 'Cam@cambridge.edu.uk', '2025-12-10 19:15:00+00', 3, 'Food was okay, but a bit overpriced for a student budget.'),
--   (3, 'Dan@deven.at', '2025-12-15 20:00:00+01', 5, 'Phänomenales Essen! The local wine selection is top-notch.'),
--   (2, 'Emily@Ely.fr', '2025-12-20 13:20:00+01', 4, 'Very charming bistro. The desserts reminded me of home.'),
--   (3, 'Dan@deven.at', NOW(), 2, 'Wait time was over an hour even with a reservation. Disappointing.'),
--   (1, 'Amy@abc.com', NOW(), 5, 'Came back for a second visit, still 5 stars!');

-- INSERT INTO Menu (restaurantID, name, description)
-- VALUES 
--     (1, 'Lunch Specials', 'Available 12pm - 3pm'),
--     (2, 'Evening Menu', 'Our full selection of gourmet dishes');

-- INSERT INTO Dish (menuID, name, description, price, photoLink)
-- VALUES 
--     (1, 'Wiener Schnitzel', 'Classic veal schnitzel', 18.50, 'schnitzel.jpg'),
--     (2, 'Vegetable Stir Fry', 'Fresh seasonal veggies', 12.00, 'stirfry.jpg');

-- INSERT INTO "Order" (customerEmail, restaurantID, status, deliveryAddress)
-- VALUES 
--     ('Amy@abc.com', 1, 'completed', '1 Florabella Villas, Chalfont St Giles'),
--     ('Brian@bobble.co.uk', 2, 'processing', '46 Beatrice Avenue, Saltash');

-- INSERT INTO OrderItem (orderID, dishID, quantity, unitPrice)
-- VALUES 
--     (1, 1, 2, 18.50), -- Amy ordered 2 Schnitzels
--     (2, 2, 1, 12.00); -- Brian ordered 1 Stir Fry


