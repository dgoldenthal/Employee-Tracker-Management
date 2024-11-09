# Employee-Tracker-Management

A command-line application to manage a company's employee database, built with Node.js, Inquirer, and PostgreSQL.

# Features

* View all departments, roles, and employees
* Add departments, roles, and employees
* Update employee roles and managers
* View employees by manager or department
* Delete departments, roles, and employees
* View total utilized budget by department

# Installation

1. Clone the repository
2. Install dependencies:
      npm install

3. Create PostgreSQL database:
      psql -U postgres
      CREATE DATABASE employee_db;

4. Run schema and seeds:
      psql -U postgres -d employee_db -f schema.sql
      psql -U postgres -d employee_db -f seeds.sql

5. Update database configuration in db/index.js with your PostgreSQL credentials

# Usage

  Start the application: node index.js
  Follow the interactive prompts to manage your employee database.

# Dependencies

* Node.js
* PostgreSQL
* Inquirer
* pg (node-postgres)
* console.table

# Database Schema

## department 
o id: SERIAL PRIMARY KEY
o name: VARCHAR(30) UNIQUE NOT NULL

## role 
o id: SERIAL PRIMARY KEY
o title: VARCHAR(30) UNIQUE NOT NULL
o salary: DECIMAL NOT NULL
o department_id: INTEGER NOT NULL (Foreign Key)

## employee 
o id: SERIAL PRIMARY KEY
o first_name: VARCHAR(30) NOT NULL
o last_name: VARCHAR(30) NOT NULL
o role_id: INTEGER NOT NULL (Foreign Key)
o manager_id: INTEGER (Foreign Key, can be null)



