const inquirer = require('inquirer');
const pool = require('./db');
require('console.table');

// All viewing functions
async function viewDepartments() {
    try {
        const result = await pool.query('SELECT * FROM department');
        console.table(result.rows);
    } catch (err) {
        console.error('Error viewing departments:', err);
    }
}

async function viewRoles() {
    try {
        const result = await pool.query(`
            SELECT r.id, r.title, d.name AS department, r.salary 
            FROM role r 
            JOIN department d ON r.department_id = d.id
        `);
        console.table(result.rows);
    } catch (err) {
        console.error('Error viewing roles:', err);
    }
}

async function viewEmployees() {
    try {
        const result = await pool.query(`
            SELECT 
                e.id,
                e.first_name,
                e.last_name,
                r.title,
                d.name AS department,
                r.salary,
                CONCAT(m.first_name, ' ', m.last_name) AS manager
            FROM employee e
            LEFT JOIN role r ON e.role_id = r.id
            LEFT JOIN department d ON r.department_id = d.id
            LEFT JOIN employee m ON e.manager_id = m.id
        `);
        console.table(result.rows);
    } catch (err) {
        console.error('Error viewing employees:', err);
    }
}

// New viewing functions
async function viewEmployeesByManager() {
    try {
        const managers = await pool.query(`
            SELECT DISTINCT 
                m.id,
                CONCAT(m.first_name, ' ', m.last_name) AS name
            FROM employee e
            JOIN employee m ON e.manager_id = m.id
        `);

        if (managers.rows.length === 0) {
            console.log('No managers found in the system.');
            return;
        }

        const { managerId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'managerId',
                message: 'Select a manager to view their employees:',
                choices: managers.rows.map(manager => ({
                    name: manager.name,
                    value: manager.id
                }))
            }
        ]);

        const result = await pool.query(`
            SELECT 
                e.first_name,
                e.last_name,
                r.title,
                d.name AS department
            FROM employee e
            JOIN role r ON e.role_id = r.id
            JOIN department d ON r.department_id = d.id
            WHERE e.manager_id = $1
        `, [managerId]);

        console.table(result.rows);
    } catch (err) {
        console.error('Error viewing employees by manager:', err);
    }
}

async function viewEmployeesByDepartment() {
    try {
        const departments = await pool.query('SELECT * FROM department');
        
        const { departmentId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'Select a department to view its employees:',
                choices: departments.rows.map(dept => ({
                    name: dept.name,
                    value: dept.id
                }))
            }
        ]);

        const result = await pool.query(`
            SELECT 
                e.first_name,
                e.last_name,
                r.title,
                CONCAT(m.first_name, ' ', m.last_name) AS manager
            FROM employee e
            JOIN role r ON e.role_id = r.id
            LEFT JOIN employee m ON e.manager_id = m.id
            WHERE r.department_id = $1
        `, [departmentId]);

        console.table(result.rows);
    } catch (err) {
        console.error('Error viewing employees by department:', err);
    }
}

async function viewDepartmentBudget() {
    try {
        const departments = await pool.query('SELECT * FROM department');
        
        const { departmentId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'Select a department to view its total utilized budget:',
                choices: departments.rows.map(dept => ({
                    name: dept.name,
                    value: dept.id
                }))
            }
        ]);

        const result = await pool.query(`
            SELECT 
                d.name AS department,
                COUNT(e.id) AS employee_count,
                COALESCE(SUM(r.salary), 0) AS total_utilized_budget
            FROM department d
            LEFT JOIN role r ON d.id = r.department_id
            LEFT JOIN employee e ON r.id = e.role_id
            WHERE d.id = $1
            GROUP BY d.name
        `, [departmentId]);

        console.table(result.rows);
    } catch (err) {
        console.error('Error viewing department budget:', err);
    }
}

// All adding functions
async function addDepartment() {
    try {
        const { name } = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'What is the name of the department?',
                validate: input => input.length > 0 || 'Department name cannot be empty'
            }
        ]);

        await pool.query('INSERT INTO department (name) VALUES ($1)', [name]);
        console.log(`Added ${name} department`);
    } catch (err) {
        console.error('Error adding department:', err);
    }
}

async function addRole() {
    try {
        const departments = await pool.query('SELECT * FROM department');
        
        const { title, salary, departmentId } = await inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'What is the title of the role?',
                validate: input => input.length > 0 || 'Role title cannot be empty'
            },
            {
                type: 'number',
                name: 'salary',
                message: 'What is the salary for this role?',
                validate: input => !isNaN(input) || 'Please enter a valid number'
            },
            {
                type: 'list',
                name: 'departmentId',
                message: 'Which department does this role belong to?',
                choices: departments.rows.map(dept => ({
                    name: dept.name,
                    value: dept.id
                }))
            }
        ]);

        await pool.query(
            'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)',
            [title, salary, departmentId]
        );
        console.log(`Added ${title} role`);
    } catch (err) {
        console.error('Error adding role:', err);
    }
}

async function addEmployee() {
    try {
        const roles = await pool.query('SELECT * FROM role');
        const employees = await pool.query('SELECT * FROM employee');

        const { firstName, lastName, roleId, managerId } = await inquirer.prompt([
            {
                type: 'input',
                name: 'firstName',
                message: "What is the employee's first name?",
                validate: input => input.length > 0 || 'First name cannot be empty'
            },
            {
                type: 'input',
                name: 'lastName',
                message: "What is the employee's last name?",
                validate: input => input.length > 0 || 'Last name cannot be empty'
            },
            {
                type: 'list',
                name: 'roleId',
                message: "What is the employee's role?",
                choices: roles.rows.map(role => ({
                    name: role.title,
                    value: role.id
                }))
            },
            {
                type: 'list',
                name: 'managerId',
                message: "Who is the employee's manager?",
                choices: [
                    { name: 'None', value: null },
                    ...employees.rows.map(emp => ({
                        name: `${emp.first_name} ${emp.last_name}`,
                        value: emp.id
                    }))
                ]
            }
        ]);

        await pool.query(
            'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
            [firstName, lastName, roleId, managerId]
        );
        console.log(`Added ${firstName} ${lastName} as a new employee`);
    } catch (err) {
        console.error('Error adding employee:', err);
    }
}

// All update functions
async function updateEmployeeRole() {
    try {
        const employees = await pool.query('SELECT * FROM employee');
        const roles = await pool.query('SELECT * FROM role');

        const { employeeId, roleId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: "Which employee's role do you want to update?",
                choices: employees.rows.map(emp => ({
                    name: `${emp.first_name} ${emp.last_name}`,
                    value: emp.id
                }))
            },
            {
                type: 'list',
                name: 'roleId',
                message: 'Which role do you want to assign to the selected employee?',
                choices: roles.rows.map(role => ({
                    name: role.title,
                    value: role.id
                }))
            }
        ]);

        await pool.query(
            'UPDATE employee SET role_id = $1 WHERE id = $2',
            [roleId, employeeId]
        );
        console.log('Updated employee role successfully');
    } catch (err) {
        console.error('Error updating employee role:', err);
    }
}

async function updateEmployeeManager() {
    try {
        // First get all employees
        const employees = await pool.query(`
            SELECT id, first_name, last_name 
            FROM employee 
            ORDER BY first_name, last_name
        `);

        // First prompt to select the employee
        const { employeeId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: "Which employee's manager do you want to update?",
                choices: employees.rows.map(emp => ({
                    name: `${emp.first_name} ${emp.last_name}`,
                    value: emp.id
                }))
            }
        ]);

        // Then create manager choices excluding the selected employee
        const managerChoices = [
            { name: 'None', value: null },
            ...employees.rows
                .filter(emp => emp.id !== employeeId)
                .map(emp => ({
                    name: `${emp.first_name} ${emp.last_name}`,
                    value: emp.id
                }))
        ];

        // Second prompt to select the new manager
        const { managerId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'managerId',
                message: "Who is the employee's new manager?",
                choices: managerChoices
            }
        ]);

        // Update the database
        await pool.query(
            'UPDATE employee SET manager_id = $1 WHERE id = $2',
            [managerId, employeeId]
        );

        console.log('Updated employee manager successfully');
    } catch (err) {
        console.error('Error updating employee manager:', err);
    }
}

// All delete functions
async function deleteDepartment() {
    try {
        const departments = await pool.query('SELECT * FROM department');
        
        const { departmentId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'Which department do you want to delete?',
                choices: departments.rows.map(dept => ({
                    name: dept.name,
                    value: dept.id
                }))
            }
        ]);

        await pool.query('DELETE FROM department WHERE id = $1', [departmentId]);
        console.log('Department deleted successfully');
    } catch (err) {
        console.error('Error deleting department:', err);
    }
}

async function deleteRole() {
    try {
        const roles = await pool.query('SELECT * FROM role');
        
        const { roleId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'roleId',
                message: 'Which role do you want to delete?',
                choices: roles.rows.map(role => ({
                    name: role.title,
                    value: role.id
                }))
            }
        ]);

        await pool.query('DELETE FROM role WHERE id = $1', [roleId]);
        console.log('Role deleted successfully');
    } catch (err) {
        console.error('Error deleting role:', err);
    }
}

async function deleteEmployee() {
    try {
        const employees = await pool.query('SELECT * FROM employee');
        
        const { employeeId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Which employee do you want to delete?',
                choices: employees.rows.map(emp => ({
                    name: `${emp.first_name} ${emp.last_name}`,
                    value: emp.id
                }))
            }
        ]);

        await pool.query('DELETE FROM employee WHERE id = $1', [employeeId]);
        console.log('Employee deleted successfully');
    } catch (err) {
        console.error('Error deleting employee:', err);
    }
}

// Main menu function with all options
async function mainMenu() {
    const { choice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'What would you like to do?',
            choices: [
                'View All Departments',
                'View All Roles',
                'View All Employees',
                'View Employees by Manager',
                'View Employees by Department',
                'View Department Budget',
                'Add Department',
                'Add Role',
                'Add Employee',
                'Update Employee Role',
                'Update Employee Manager',
                'Delete Department',
                'Delete Role',
                'Delete Employee',
                'Exit'
            ]
        }
    ]);

    switch (choice) {
        case 'View All Departments':
            await viewDepartments();
            break;
        case 'View All Roles':
            await viewRoles();
            break;
        case 'View All Employees':
            await viewEmployees();
            break;
        case 'View Employees by Manager':
            await viewEmployeesByManager();
            break;
        case 'View Employees by Department':
            await viewEmployeesByDepartment();
            break;
        case 'View Department Budget':
            await viewDepartmentBudget();
            break;
        case 'Add Department':
            await addDepartment();
            break;
        case 'Add Role':
            await addRole();
            break;
        case 'Add Employee':
            await addEmployee();
            break;
        case 'Update Employee Role':
            await updateEmployeeRole();
            break;
        case 'Update Employee Manager':
            await updateEmployeeManager();
            break;
        case 'Delete Department':
            await deleteDepartment();
            break;
        case 'Delete Role':
            await deleteRole();
            break;
        case 'Delete Employee':
            await deleteEmployee();
            break;
        case 'Exit':
            console.log('Goodbye!');
            process.exit();
    }
    await mainMenu();
}

// Start the application
console.log('Welcome to the Employee Management System!');
mainMenu().catch(console.error);