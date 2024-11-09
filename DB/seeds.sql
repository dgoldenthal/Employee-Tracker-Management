INSERT INTO department (name) VALUES 
    ('Engineering'),
    ('Sales'),
    ('Finance'),
    ('Legal');

INSERT INTO role (title, salary, department_id) VALUES
    ('Software Engineer', 120000, 1),
    ('Lead Engineer', 150000, 1),
    ('Sales Representative', 80000, 2),
    ('Sales Manager', 100000, 2),
    ('Accountant', 125000, 3),
    ('Legal Counsel', 190000, 4);

INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES
    ('John', 'Doe', 2, NULL),
    ('Jane', 'Smith', 1, 1),
    ('Mike', 'Wilson', 4, NULL),
    ('Sarah', 'Brown', 3, 3),
    ('Tom', 'Allen', 5, NULL),
    ('Lisa', 'Johnson', 6, NULL);