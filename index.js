const inquirer = require('inquirer');
const db = require('./db/queries');
const { table } = require('table');

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
                'Add Department',
                'Add Role',
                'Add Employee',
                'Update Employee Role',
                'Update Employee Manager',
                'View Employees by Manager',
                'View Employees by Department',
                'Delete Department',
                'Delete Role',
                'Delete Employee',
                'View Department Budget',
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
        case 'View Employees by Manager':
            await viewEmployeesByManager();
            break;
        case 'View Employees by Department':
            await viewEmployeesByDepartment();
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
        case 'View Department Budget':
            await viewDepartmentBudget();
            break;
        case 'Exit':
            console.log('Goodbye!');
            process.exit();
    }
    
    if (choice !== 'Exit') {
        await mainMenu();
    }
}

// Implementation of menu options
async function viewDepartments() {
    const departments = await db.viewAllDepartments();
    console.table(departments);
}

async function viewRoles() {
    const roles = await db.viewAllRoles();
    console.table(roles);
}

async function viewEmployees() {
    const employees = await db.viewAllEmployees();
    console.table(employees);
}

async function addDepartment() {
    const { name } = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'What is the name of the department?',
            validate: input => input.length > 0 || 'Department name cannot be empty'
        }
    ]);

    await db.addDepartment(name);
    console.log(`Added ${name} department`);
}

async function addRole() {
    const departments = await db.viewAllDepartments();
    
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
            choices: departments.map(dept => ({
                name: dept.name,
                value: dept.id
            }))
        }
    ]);

    await db.addRole(title, salary, departmentId);
    console.log(`Added ${title} role`);
}

async function addEmployee() {
    const roles = await db.viewAllRoles();
    const employees = await db.viewAllEmployees();
    
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
            choices: roles.map(role => ({
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
                ...employees.map(emp => ({
                    name: `${emp.first_name} ${emp.last_name}`,
                    value: emp.id
                }))
            ]
        }
    ]);

    await db.addEmployee(firstName, lastName, roleId, managerId);
    console.log(`Added ${firstName} ${lastName} to the database`);
}

// Start the application
console.log('Welcome to the Employee Management System!');
mainMenu().catch(console.error);