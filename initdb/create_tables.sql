DROP TABLE IF EXISTS User;

CREATE TABLE User
(
  email PRIMARY KEY,
  password varchar(100) NOT NULL,
  fullname varchar(100) NOT NULL
);

INSERT INTO User (email, password, fullname)
VALUES 
    ('Amy@abc.com', 'mypassA', 'Amy Peterson'),
    ('Brian@bobble.co.uk', 'secretB', 'Brian Benderson'),
    ('Cam@cambridge.edu.uk', 'MyPasswordC', 'Cameron Charleston');