const pool = require('./index');

class DB {
    // View all departments
    async viewAllDepartments() {
        const query = 'SELECT * FROM department ORDER BY id';
        const { rows } = await pool.query(query);
        return rows;
    }

    // View all roles
    async viewAllRoles() {
        const query = `
            SELECT r.id, r.title, d.name AS department, r.salary 
            FROM role r 
            JOIN department d ON r.department_id = d.id 
            ORDER BY r.id
        `;
        const { rows } = await pool.query(query);
        return rows;
    }

    // View all employees
    async viewAllEmployees() {
        const query = `
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
            ORDER BY e.id
        `;
        const { rows } = await pool.query(query);
        return rows;
    }

    // Add a department
    async addDepartment(name) {
        const query = 'INSERT INTO department (name) VALUES ($1) RETURNING *';
        const { rows } = await pool.query(query, [name]);
        return rows[0];
    }

    // Add a role
    async addRole(title, salary, departmentId) {
        const query = `
            INSERT INTO role (title, salary, department_id) 
            VALUES ($1, $2, $3) 
            RETURNING *
        `;
        const { rows } = await pool.query(query, [title, salary, departmentId]);
        return rows[0];
    }

    // Add an employee
    async addEmployee(firstName, lastName, roleId, managerId) {
        const query = `
            INSERT INTO employee (first_name, last_name, role_id, manager_id) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;
        const { rows } = await pool.query(query, [firstName, lastName, roleId, managerId]);
        return rows[0];
    }

    // Update employee role
    async updateEmployeeRole(employeeId, roleId) {
        const query = `
            UPDATE employee 
            SET role_id = $2 
            WHERE id = $1 
            RETURNING *
        `;
        const { rows } = await pool.query(query, [employeeId, roleId]);
        return rows[0];
    }

    // Additional functionality
    async updateEmployeeManager(employeeId, managerId) {
        const query = `
            UPDATE employee 
            SET manager_id = $2 
            WHERE id = $1 
            RETURNING *
        `;
        const { rows } = await pool.query(query, [employeeId, managerId]);
        return rows[0];
    }

    async viewEmployeesByManager(managerId) {
        const query = `
            SELECT 
                e.id,
                e.first_name,
                e.last_name,
                r.title,
                d.name AS department
            FROM employee e
            JOIN role r ON e.role_id = r.id
            JOIN department d ON r.department_id = d.id
            WHERE e.manager_id = $1
        `;
        const { rows } = await pool.query(query, [managerId]);
        return rows;
    }

    async viewEmployeesByDepartment(departmentId) {
        const query = `
            SELECT 
                e.id,
                e.first_name,
                e.last_name,
                r.title
            FROM employee e
            JOIN role r ON e.role_id = r.id
            WHERE r.department_id = $1
        `;
        const { rows } = await pool.query(query, [departmentId]);
        return rows;
    }

    async deleteDepartment(id) {
        const query = 'DELETE FROM department WHERE id = $1 RETURNING *';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }

    async deleteRole(id) {
        const query = 'DELETE FROM role WHERE id = $1 RETURNING *';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }

    async deleteEmployee(id) {
        const query = 'DELETE FROM employee WHERE id = $1 RETURNING *';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }

    async getDepartmentBudget(departmentId) {
        const query = `
            SELECT 
                d.name,
                SUM(r.salary) as total_budget
            FROM department d
            JOIN role r ON d.id = r.department_id
            JOIN employee e ON r.id = e.role_id
            WHERE d.id = $1
            GROUP BY d.name
        `;
        const { rows } = await pool.query(query, [departmentId]);
        return rows[0];
    }
}

module.exports = new DB();