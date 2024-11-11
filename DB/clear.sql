-- Clear existing data
TRUNCATE TABLE employee CASCADE;
TRUNCATE TABLE role CASCADE;
TRUNCATE TABLE department CASCADE;

-- Reset sequences
ALTER SEQUENCE department_id_seq RESTART WITH 1;
ALTER SEQUENCE role_id_seq RESTART WITH 1;
ALTER SEQUENCE employee_id_seq RESTART WITH 1;