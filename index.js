const inquirer = require('inquirer');
const pool = require('./db');
require('console.table');

// All viewing functions
async function viewDepartments() {
    try {
        const result = await pool.query('SELECT * FROM department ORDER BY name');
        console.log('\n');
        console.table(result.rows);
    } catch (err) {
        console.error('\x1b[31m', 'Error viewing departments:', err.message, '\x1b[0m');
    }
}

async function viewRoles() {
    try {
        const result = await pool.query(`
            SELECT r.id, r.title, d.name AS department, r.salary 
            FROM role r 
            JOIN department d ON r.department_id = d.id
            ORDER BY r.title
        `);
        console.log('\n');
        console.table(result.rows);
    } catch (err) {
        console.error('\x1b[31m', 'Error viewing roles:', err.message, '\x1b[0m');
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
            ORDER BY e.last_name, e.first_name
        `);
        console.log('\n');
        console.table(result.rows);
    } catch (err) {
        console.error('\x1b[31m', 'Error viewing employees:', err.message, '\x1b[0m');
    }
}

async function viewEmployeesByManager() {
    try {
        const managers = await pool.query(`
            SELECT DISTINCT 
                m.id,
                CONCAT(m.first_name, ' ', m.last_name) AS name
            FROM employee e
            JOIN employee m ON e.manager_id = m.id
            ORDER BY name
        `);

        if (managers.rows.length === 0) {
            console.log('\x1b[33m', 'No managers found in the system.', '\x1b[0m');
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
            ORDER BY e.last_name, e.first_name
        `, [managerId]);

        console.log('\n');
        console.table(result.rows);
    } catch (err) {
        console.error('\x1b[31m', 'Error viewing employees by manager:', err.message, '\x1b[0m');
    }
}

async function viewEmployeesByDepartment() {
    try {
        const departments = await pool.query('SELECT * FROM department ORDER BY name');
        
        if (departments.rows.length === 0) {
            console.log('\x1b[33m', 'No departments exist in the system.', '\x1b[0m');
            return;
        }

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
            ORDER BY e.last_name, e.first_name
        `, [departmentId]);

        console.log('\n');
        if (result.rows.length === 0) {
            console.log('\x1b[33m', 'No employees found in this department.', '\x1b[0m');
        } else {
            console.table(result.rows);
        }
    } catch (err) {
        console.error('\x1b[31m', 'Error viewing employees by department:', err.message, '\x1b[0m');
    }
}

async function viewDepartmentBudget() {
    try {
        const departments = await pool.query('SELECT * FROM department ORDER BY name');
        
        if (departments.rows.length === 0) {
            console.log('\x1b[33m', 'No departments exist in the system.', '\x1b[0m');
            return;
        }

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

        console.log('\n');
        console.table(result.rows);
    } catch (err) {
        console.error('\x1b[31m', 'Error viewing department budget:', err.message, '\x1b[0m');
    }
}

// Enhanced adding functions
async function addDepartment() {
    try {
        const { name } = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'What is the name of the department?',
                validate: input => {
                    if (!input.trim()) {
                        return 'Department name cannot be empty';
                    }
                    return true;
                }
            }
        ]);

        // Check if department name already exists
        const existingDept = await pool.query(
            'SELECT * FROM department WHERE LOWER(name) = LOWER($1)',
            [name.trim()]
        );

        if (existingDept.rows.length > 0) {
            console.log('\x1b[31m', `Error: Department '${name}' already exists!`, '\x1b[0m');
            return;
        }

        await pool.query('INSERT INTO department (name) VALUES ($1)', [name.trim()]);
        console.log('\x1b[32m', `Successfully added department: ${name}`, '\x1b[0m');
    } catch (err) {
        console.error('\x1b[31m', 'Error adding department:', err.message, '\x1b[0m');
    }
}

async function addRole() {
    try {
        const departments = await pool.query('SELECT * FROM department ORDER BY name');
        
        if (departments.rows.length === 0) {
            console.log('\x1b[31m', 'Error: No departments exist. Please create a department first.', '\x1b[0m');
            return;
        }

        const { title, salary, departmentId } = await inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'What is the title of the role?',
                validate: async (input) => {
                    if (!input.trim()) {
                        return 'Role title cannot be empty';
                    }
                    // Check if role title already exists
                    const existingRole = await pool.query(
                        'SELECT * FROM role WHERE LOWER(title) = LOWER($1)',
                        [input.trim()]
                    );
                    if (existingRole.rows.length > 0) {
                        return `Role '${input}' already exists!`;
                    }
                    return true;
                }
            },
            {
                type: 'input',
                name: 'salary',
                message: 'What is the salary for this role?',
                validate: input => {
                    const salary = parseFloat(input);
                    if (isNaN(salary)) {
                        return 'Please enter a valid number';
                    }
                    if (salary < 0) {
                        return 'Salary cannot be negative';
                    }
                    if (salary > 1000000000) {
                        return 'Salary value is too high';
                    }
                    return true;
                }
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
            [title.trim(), parseFloat(salary), departmentId]
        );
        console.log('\x1b[32m', `Successfully added role: ${title} with salary: $${salary}`, '\x1b[0m');
    } catch (err) {
        console.error('\x1b[31m', 'Error adding role:', err.message, '\x1b[0m');
    }
}

async function addEmployee() {
    try {
        const roles = await pool.query('SELECT * FROM role ORDER BY title');
        
        if (roles.rows.length === 0) {
            console.log('\x1b[31m', 'Error: No roles exist. Please create a role first.', '\x1b[0m');
            return;
        }

        const employees = await pool.query(`
            SELECT id, CONCAT(first_name, ' ', last_name) AS name 
            FROM employee 
            ORDER BY name
        `);

        const { firstName, lastName, roleId, managerId } = await inquirer.prompt([
            {
                type: 'input',
                name: 'firstName',
                message: "What is the employee's first name?",
                validate: input => {
                    if (!input.trim()) return 'First name cannot be empty';
                    return true;
                }
            },
            {
                type: 'input',
                name: 'lastName',
                message: "What is the employee's last name?",
                validate: input => {
                    if (!input.trim()) return 'Last name cannot be empty';
                    return true;
                }
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
                        name: emp.name,
                        value: emp.id
                    }))
                ]
            }
        ]);

        await pool.query(
            'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
            [firstName.trim(), lastName.trim(), roleId, managerId]
        );
        console.log('\x1b[32m', `Successfully added employee: ${firstName} ${lastName}`, '\x1b[0m');
    } catch (err) {
        console.error('\x1b[31m', 'Error adding employee:', err.message, '\x1b[0m');
    }
}

// Enhanced update functions
async function updateEmployeeRole() {
    try {
        const employees = await pool.query(`
            SELECT e.id, CONCAT(e.first_name, ' ', e.last_name) AS name, r.title
            FROM employee e
            JOIN role r ON e.role_id = r.id
            ORDER BY name
        `);

        if (employees.rows.length === 0) {
            console.log('\x1b[33m', 'No employees exist to update.', '\x1b[0m');
            return;
        }

        const roles = await pool.query('SELECT * FROM role ORDER BY title');

        const { employeeId, roleId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: "Which employee's role do you want to update?",
                choices: employees.rows.map(emp => ({
                    name: `${emp.name} (Current Role: ${emp.title})`,
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
        console.log('\x1b[32m', 'Successfully updated employee role', '\x1b[0m');
    } catch (err) {
        console.error('\x1b[31m', 'Error updating employee role:', err.message, '\x1b[0m');
    }
}

async function updateEmployeeManager() {
    try {
        const employees = await pool.query(`
            SELECT 
                e.id, 
                CONCAT(e.first_name, ' ', e.last_name) AS name,
                CONCAT(m.first_name, ' ', m.last_name) AS current_manager
            FROM employee e
            LEFT JOIN employee m ON e.manager_id = m.id
            ORDER BY e.first_name, e.last_name
        `);

        if (employees.rows.length === 0) {
            console.log('\x1b[33m', 'No employees exist to update.', '\x1b[0m');
            return;
        }

        const { employeeId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: "Which employee's manager do you want to update?",
                choices: employees.rows.map(emp => ({
                    name: `${emp.name} (Current Manager: ${emp.current_manager || 'None'})`,
                    value: emp.id
                }))
            }
        ]);

        const managerChoices = [
            { name: 'None', value: null },
            ...employees.rows
                .filter(emp => emp.id !== employeeId)
                .map(emp => ({
                    name: emp.name,
                    value: emp.id
                }))
        ];

        const { managerId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'managerId',
                message: "Who is the employee's new manager?",
                choices: managerChoices
            }
        ]);

        await pool.query(
            'UPDATE employee SET manager_id = $1 WHERE id = $2',
            [managerId, employeeId]
        );
        console.log('\x1b[32m', 'Successfully updated employee manager', '\x1b[0m');
    } catch (err) {
        console.error('\x1b[31m', 'Error updating employee manager:', err.message, '\x1b[0m');
    }
}

// Enhanced delete functions
async function deleteDepartment() {
    try {
        const departments = await pool.query('SELECT * FROM department ORDER BY name');
        
        if (departments.rows.length === 0) {
            console.log('\x1b[33m', 'No departments exist to delete.', '\x1b[0m');
            return;
        }

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

        // Check for existing roles in the department
        const existingRoles = await pool.query(
            'SELECT COUNT(*) FROM role WHERE department_id = $1',
            [departmentId]
        );

        if (existingRoles.rows[0].count > 0) {
            console.log(
                '\x1b[31m',
                `Error: Cannot delete department because it has ${existingRoles.rows[0].count} role(s) associated with it.`,
                'Please delete or reassign these roles first.',
                '\x1b[0m'
            );
            
            // Show the roles in this department
            const roles = await pool.query(
                'SELECT title FROM role WHERE department_id = $1 ORDER BY title',
                [departmentId]
            );
            console.log('\nRoles in this department:');
            roles.rows.forEach(role => console.log(`- ${role.title}`));
            return;
        }

        // Get department name for confirmation message
        const departmentName = departments.rows.find(dept => dept.id === departmentId).name;

        // Confirm deletion
        const { confirmDelete } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmDelete',
                message: `Are you sure you want to delete the department: ${departmentName}?`,
                default: false
            }
        ]);

        if (!confirmDelete) {
            console.log('\x1b[33m', 'Deletion cancelled.', '\x1b[0m');
            return;
        }

        await pool.query('DELETE FROM department WHERE id = $1', [departmentId]);
        console.log('\x1b[32m', `Successfully deleted department: ${departmentName}`, '\x1b[0m');
    } catch (err) {
        console.error('\x1b[31m', 'Error deleting department:', err.message, '\x1b[0m');
    }
}

async function deleteRole() {
    try {
        const roles = await pool.query(`
            SELECT r.id, r.title, d.name as department_name 
            FROM role r 
            JOIN department d ON r.department_id = d.id
            ORDER BY r.title
        `);
        
        if (roles.rows.length === 0) {
            console.log('\x1b[33m', 'No roles exist to delete.', '\x1b[0m');
            return;
        }

        const { roleId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'roleId',
                message: 'Which role do you want to delete?',
                choices: roles.rows.map(role => ({
                    name: `${role.title} (${role.department_name})`,
                    value: role.id
                }))
            }
        ]);

        // Check for existing employees in the role
        const existingEmployees = await pool.query(
            'SELECT COUNT(*) FROM employee WHERE role_id = $1',
            [roleId]
        );

        if (existingEmployees.rows[0].count > 0) {
            console.log(
                '\x1b[31m',
                `Error: Cannot delete role because it has ${existingEmployees.rows[0].count} employee(s) assigned to it.`,
                'Please reassign or delete these employees first.',
                '\x1b[0m'
            );
            
            // Show the employees in this role
            const employees = await pool.query(
                'SELECT first_name, last_name FROM employee WHERE role_id = $1 ORDER BY last_name, first_name',
                [roleId]
            );
            console.log('\nEmployees in this role:');
            employees.rows.forEach(emp => 
                console.log(`- ${emp.first_name} ${emp.last_name}`)
            );
            return;
        }

        // Get role name for confirmation message
        const roleName = roles.rows.find(role => role.id === roleId).title;

        // Confirm deletion
        const { confirmDelete } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmDelete',
                message: `Are you sure you want to delete the role: ${roleName}?`,
                default: false
            }
        ]);

        if (!confirmDelete) {
            console.log('\x1b[33m', 'Deletion cancelled.', '\x1b[0m');
            return;
        }

        await pool.query('DELETE FROM role WHERE id = $1', [roleId]);
        console.log('\x1b[32m', `Successfully deleted role: ${roleName}`, '\x1b[0m');
    } catch (err) {
        console.error('\x1b[31m', 'Error deleting role:', err.message, '\x1b[0m');
    }
}

async function deleteEmployee() {
    try {
        const employees = await pool.query(`
            SELECT 
                e.id, 
                e.first_name,
                e.last_name,
                r.title,
                d.name as department_name
            FROM employee e
            JOIN role r ON e.role_id = r.id
            JOIN department d ON r.department_id = d.id
            ORDER BY e.last_name, e.first_name
        `);
        
        if (employees.rows.length === 0) {
            console.log('\x1b[33m', 'No employees exist to delete.', '\x1b[0m');
            return;
        }

        const { employeeId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Which employee do you want to delete?',
                choices: employees.rows.map(emp => ({
                    name: `${emp.first_name} ${emp.last_name} (${emp.title} - ${emp.department_name})`,
                    value: emp.id
                }))
            }
        ]);

        // Check if employee is a manager
        const managedEmployees = await pool.query(
            'SELECT COUNT(*) FROM employee WHERE manager_id = $1',
            [employeeId]
        );

        if (managedEmployees.rows[0].count > 0) {
            console.log(
                '\x1b[31m',
                `Warning: This employee is a manager for ${managedEmployees.rows[0].count} employee(s).`,
                'These employees will no longer have a manager assigned.',
                '\x1b[0m'
            );
        }

        const employeeName = `${employees.rows.find(emp => emp.id === employeeId).first_name} ${employees.rows.find(emp => emp.id === employeeId).last_name}`;

        // Confirm deletion
        const { confirmDelete } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmDelete',
                message: `Are you sure you want to delete the employee: ${employeeName}?`,
                default: false
            }
        ]);

        if (!confirmDelete) {
            console.log('\x1b[33m', 'Deletion cancelled.', '\x1b[0m');
            return;
        }

        await pool.query('DELETE FROM employee WHERE id = $1', [employeeId]);
        console.log('\x1b[32m', `Successfully deleted employee: ${employeeName}`, '\x1b[0m');
    } catch (err) {
        console.error('\x1b[31m', 'Error deleting employee:', err.message, '\x1b[0m');
    }
}

// Main menu function
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
            console.log('\x1b[32m', 'Goodbye!', '\x1b[0m');
            process.exit();
    }
    await mainMenu();
}

// Start the application
console.log('\x1b[36m','╔═══════════════════════════════════════╗');
console.log(' ║ Welcome to Employee Management System ║');
console.log(' ╚═══════════════════════════════════════╝', '\x1b[0m');
mainMenu().catch(console.error);