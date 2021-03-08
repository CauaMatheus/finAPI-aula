const { request, response } = require('express');
const express = require('express');
const routes = express.Router();
const { v4: uuid } = require('uuid');

const customers = [];

function verifyIfAccountAlreadyExistsByCPF(request, response, next) {
  const { cpf } = request.headers
  const customer = customers.find(customer => customer.cpf === cpf);
  request.customer = customer;
  customer ? next() : response.status(400).json({ message: "Customer Does Not Exist" });
}

function getBalance(statment) {
  const balance = statment.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + Number(operation.amount)
    } else {
      return acc - Number(operation.amount)
    }
  }, 0);
  return balance;
}

routes.get('/account', verifyIfAccountAlreadyExistsByCPF, (request, response) => {
  const { customer } = request;
  customer ? response.json(customer) : response.status(400).json({
    message: "User Does Not Exist"
  })
});

routes.post('/account', (request, response) => {
  const { name, cpf } = request.body;
  const customersAlreadyExists = customers.some(customer => {
    return customer.cpf === cpf
  });

  if (customersAlreadyExists) {
    return response.status(400).json({
      message: "Customer Already Exists"
    })
  } else {
    customers.push({
      id: uuid(),
      name,
      cpf,
      statment: []
    });
    return response.status(201).send();
  }
});

routes.put('/account', verifyIfAccountAlreadyExistsByCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name
  return response.status(201).send()

});

routes.delete('/account', verifyIfAccountAlreadyExistsByCPF, (request, response) => {
  const { customer } = request;
  customers.splice(customer, 1);
})

routes.get('/statment', verifyIfAccountAlreadyExistsByCPF, (request, response) => {
  const { customer } = request
  return response.json(customer.statment)
});

routes.get('/statment/date', verifyIfAccountAlreadyExistsByCPF, (request, response) => {
  const { customer } = request
  const { date } = request.query;
  const dateFormat = new Date(date + ' 00:00');

  const statment = customer.statment.filter((statment) => {
    return statment.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  });

  return response.json(statment);
})

routes.post('/deposit', verifyIfAccountAlreadyExistsByCPF, (request, response) => {
  const { description, amount } = request.body;
  const { customer } = request;
  const statmentOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }
  customer.statment.push(statmentOperation);

  return response.status(201).send();
});

routes.post('/withdraw', verifyIfAccountAlreadyExistsByCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request
  const balance = getBalance(customer.statment);
  const statmentOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  }

  if (balance < amount) {
    return response.status(400).json({
      message: "Isufficient funds!"
    })
  } else {
    customer.statment.push(statmentOperation);
    return response.status(201).send()
  }
});

routes.get('/balance', verifyIfAccountAlreadyExistsByCPF, (request, response) => {
  const { customer } = request;
  const balance = getBalance(customer.statment);

  return response.json({ balance });
});

module.exports = routes;