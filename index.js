const mysql = require('mysql2');
const inquirer = require('inquirer'); 
const cTable = require('console.table'); 


require('dotenv').config(); 

const con = mysql.createConnection(
    {
      host: '127.0.0.1',
      // MySQL username,
      user: process.env.DB_USER,
      // TODO: Add MySQL password here
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE
    },
    console.log(`Connected to the employee database.`)
  );

  con.connect((error)=> { 
    if (error) {
        console.error("error connecting: " + error.stack);
        return;
    }
  }); 


  getJob(); 


  function getJob() {
    inquirer
        .prompt(
            {
                name: 'job',
                type: 'list',
                message: 'Which would you like to do?',
                choices: ['add', 'view', 'update', 'exit'],
            }
        ).then(function ({ job }) {
            switch (job) {
                case 'add':
                    add();
                    break;
                case 'view':
                    view();
                    break;
                case 'update':
                    update();
                    break;
                case 'exit':
                    connection.end()
                    return;
            }

        })
}

function add() {
    inquirer
        .prompt(
            {
                name: "db",
                message: 'Which would you like to add?',
                type: 'list',
                choices: ['department', 'role', 'employee'],
            }
        ).then(function ({ db }) {
            switch (db) {
                case "department":
                    add_department()
                    break;
                case "role":
                    add_role()
                    break;
                case 'employee':
                    add_employee();
                    break;
            }
        })

}

function add_department() {
    inquirer
        .prompt(
            {
                name: 'name',
                message: "What is the department's name?",
                type: 'input'
            }
        ).then(function ({ name }) {
            con.query(`INSERT INTO department (name) VALUES ('${name}')`, function (error, data) {
                if (error) throw error;
                console.log(`Added`)
                getJob();
            })
        })
}

function add_role() {
    let departments = []

    con.query(`SELECT * FROM department`, function (error, data) {
        if (error) throw error;

        for (let i = 0; i < data.length; i++) { // Loops through and finds the name of all the departments
            departments.push(data[i].name)

        }


        inquirer
            .prompt([
                {
                    name: 'title',
                    message: "What is the role?",
                    type: 'input'
                },
                {
                    name: 'salary',
                    message: 'How much do they make?',
                    type: 'input'
                },
                {
                    name: 'department_id',
                    message: 'What department does it belong to?',
                    type: 'list',
                    choices: departments
                }
            ]).then(function ({ title, salary, department_id }) {
                let index = departments.indexOf(department_id)

                con.query(`INSERT INTO role (title, salary, department_id) VALUES ('${title}', '${salary}', ${index})`, function (err, data) {
                    if (err) throw err;
                    console.log(`Added`)
                    getJob();
                })
            })
    })
}

function add_employee() {
    let employees = [];
    let roles = [];

    con.query(`SELECT * FROM role`, function (error, data) {
        if (error) throw error;


        for (let i = 0; i < data.length; i++) {
            roles.push(data[i].title);
        }

        con.query(`SELECT * FROM employee`, function (error, data) {
            if (error) throw error;

            for (let i = 0; i < data.length; i++) {
                employees.push(data[i].first_name);
            }

            inquirer
                .prompt([
                    {
                        name: 'first_name',
                        message: "what's the employees First Name",
                        type: 'input'
                    },
                    {
                        name: 'last_name',
                        message: 'What is their last name?',
                        type: 'input',
                    },
                    {
                        name: 'role_id',
                        message: 'What is their role?',
                        type: 'list',
                        choices: roles,
                    },
                    {
                        name: 'manager_id',
                        message: "Who is their manager?",
                        type: 'list',
                        choices: ['none'].concat(employees)
                    }
                ]).then(function ({ first_name, last_name, role_id, manager_id }) {
                    let queryText = `INSERT INTO employee (first_name, last_name, role_id`;
                    if (manager_id != 'none') {
                        queryText += `, manager_id) VALUES ('${first_name}', '${last_name}', ${roles.indexOf(role_id)}, ${employees.indexOf(manager_id) + 1})`
                    } else {
                        queryText += `) VALUES ('${first_name}', '${last_name}', ${roles.indexOf(role_id) + 1})`
                    }
                    console.log(queryText)

                    connection.query(queryText, function (error, data) {
                        if (error) throw error;

                        getJob();
                    })
                })

        })
    })
}


function view() {
    inquirer
        .prompt(
            {
                name: "db",
                message: 'Which would you like to view?',
                type: 'list',
                choices: ['department', 'role', 'employee'],
            }
        ).then(function ({ db }) {
            con.query(`SELECT * FROM ${db}`, function (error, data) {
                if (error) throw error;

                console.table(data)
                getJob();
            })
        })
}

function update() {
    inquirer
        .prompt(
            {
                name: 'update',
                message: 'What would you like to update?',
                type: 'list',
                choices: ['role', 'manager']
            }
        ).then(function ({ update }) {
            switch (update) {
                case 'role':
                    update_role();
                    break;
                case 'manager':
                    update_manager();
                    break;
            }
        })
}

function update_role() {
    con.query(`SELECT * FROM employee`, function (err, data) {
        if (error) throw error;

        let employees = [];
        let roles = [];

        for (let i = 0; i < data.length; i++) {
            employees.push(data[i].first_name)
        }

        con.query(`SELECT * FROM role`, function (err, data) {
            if (error) throw error;

            for (let i = 0; i < data.length; i++) {
                roles.push(data[i].title)
            }

            inquirer
                .prompt([
                    {
                        name: 'employee_id',
                        message: "Who's role needs to be updated",
                        type: 'list',
                        choices: employees
                    },
                    {
                        name: 'role_id',
                        message: "What is the new role?",
                        type: 'list',
                        choices: roles
                    }
                ]).then(function ({ employee_id, role_id }) {
                    //UPDATE `table_name` SET `column_name` = `new_value' [WHERE condition]
                    con.query(`UPDATE employee SET role_id = ${roles.indexOf(role_id) + 1} WHERE id = ${employees.indexOf(employee_id) + 1}`, function (err, data) {
                        if (error) throw error;

                        getJob();
                    })
                })
        })

    })
}

function update_manager() {
    con.query(`SELECT * FROM employee`, function (err, data) {
        if (error) throw error;

        let employees = [];

        for (let i = 0; i < data.length; i++) {
            employees.push(data[i].first_name)
        }

        inquirer
            .prompt([
                {
                    name: 'employee_id',
                    message: 'Who would you like to update?',
                    type: 'list',
                    choices: employees
                },
                {
                    name: "manager_id",
                    message: "Who's their new manager?",
                    type: 'list',
                    choices: ['none'].concat(employees)
                }
            ]).then(({ employee_id, manager_id }) => {
                let queryText = ""
                if (manager_id !== "none") {
                    queryText = `UPDATE employee SET manager_id = ${employees.indexOf(manager_id) + 1} WHERE id = ${employees.indexOf(employee_id) + 1}`
                } else {
                    queryText = `UPDATE employee SET manager_id = ${null} WHERE id = ${employees.indexOf(employee_id) + 1}`
                }

                con.query(queryText, function (err, data) {
                    if (error) throw error;

                    getJob();
                })

            })

    });

}