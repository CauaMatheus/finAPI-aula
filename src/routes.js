const { response } = require('express');
const express = require('express');
const routes = express.Router();
const { v4: uuid } = require('uuid')

const custommers = [];

function verifyIfAccountAlreadyExistsByCPF(request, response, next) {
  const { cpf } = request.headers
  const custummer = custommers.find(custommer => custommer.cpf === cpf);
  request.custummer = custummer;
  custummer ? next() : response.status(400).json({ message: "Custummer Does Not Exist" });
}

routes.post('/accounts', (request, response) => {
  const { name, cpf } = request.body;
  const custommersAlreadyExists = custommers.some(custommer => {
    return custommer.cpf === cpf
  });

  if (custommersAlreadyExists) {
    return response.status(400).json({
      message: "Custummer Already Exists"
    })
  } else {
    custommers.push({
      id: uuid(),
      name,
      cpf,
      statment: []
    });
    return response.status(201).send();
  }
});

routes.get('/statments', verifyIfAccountAlreadyExistsByCPF, (request, response) => {
  const { custummer } = request
  return response.json(custummer.statment)
})

module.exports = routes;