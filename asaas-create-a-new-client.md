Criar novo cliente

# Criar novo cliente

### Guia de Clientes

[Confira o guia de clientes para mais informações.](https://docs.asaas.com/docs/criando-um-cliente)

<br />

Endpoint responsável por cadastrar um novo cliente na conta Asaas.

Esse cadastro representa a base para operações posteriores da integração, como criação de cobranças, assinaturas e demais fluxos que exigem um pagador previamente identificado.

Após a criação, a API retorna o identificador único do cliente no Asaas, que deve ser armazenado pela aplicação para utilização nas próximas chamadas.

***

## Parâmetros principais da requisição

Alguns campos possuem papel importante no comportamento da integração:

* `name` — Nome do cliente exibido no cadastro
* `cpfCnpj` — Documento do cliente (critério comum de validação de duplicidade)
* `mobilePhone` e `email` — Dados utilizados para comunicação e notificações
* `externalReference` — Identificador do cliente no sistema de origem (altamente recomendado)
* `notificationDisabled` — Define se o cliente receberá notificações
* `additionalEmails` — Destinatários adicionais para notificações
* `groupName` — Permite agrupamento lógico de clientes
* `foreignCustomer` — Deve ser `true` para clientes estrangeiros

***

## Identificador retornado na criação

A resposta da API retorna o identificador único do cliente no Asaas.

Esse identificador deve ser armazenado pela aplicação, pois será utilizado em operações como:

* criação de cobranças
* criação de assinaturas
* atualização cadastral
* consulta individual
* recuperação de notificações

Embora o documento possa ser utilizado em buscas, o identificador do Asaas é o dado mais confiável para relacionamento entre entidades dentro da API.

***

## Funcionamento da criação do cliente

Este endpoint é responsável por registrar o pagador que será utilizado em operações posteriores da integração.

Após a criação, a API retorna o identificador único do cliente no Asaas, que deve ser armazenado pela aplicação para uso nas próximas chamadas.

Como a API permite a criação de clientes duplicados, integrações que exigem unicidade cadastral devem implementar validação prévia, normalmente com base em `cpfCnpj`, `externalReference` ou reaproveitamento do identificador já persistido internamente.

***

> 🚧 Atenção
>
> A API permite a criação de clientes duplicados.
> É responsabilidade da integração implementar estratégias de prevenção de duplicidade antes da criação.

***

## Estratégia de prevenção de duplicidade

As estratégias mais comuns são:

* buscar previamente por `cpfCnpj`
* validar por `externalReference`
* armazenar internamente o ID do cliente já criado e reutilizá-lo

Essa validação é especialmente importante em cenários com:

* reprocessamento de eventos
* filas assíncronas
* tentativas automáticas de cadastro

***

## Uso recomendado do externalReference

Sempre que possível, é recomendável enviar o campo `externalReference`.

Esse atributo facilita a conciliação entre sistemas, reduz a dependência de buscas por nome ou documento e ajuda a evitar criação duplicada.

Em integrações mais robustas, esse campo costuma ser o elo entre o identificador do sistema de origem e o cadastro persistido no Asaas.

***

## Comportamento do endereço com CEP

Quando a requisição informa `postalCode`, o Asaas pode preencher automaticamente informações de endereço com base no CEP enviado.

Nesse cenário, o fluxo de integração pode ser simplificado, reduzindo a necessidade de preenchimento manual de atributos complementares do endereço.

Ainda assim, o número (`addressNumber`) continua sendo um dado relevante.

***

## Clientes estrangeiros

O cadastro de clientes estrangeiros depende do ambiente e das permissões da conta.

* Em produção, essa funcionalidade precisa estar liberada
* Em sandbox, pode ser utilizada sem liberação prévia

***

> ❗️ Atenção
>
> Para integrações que operam com pagadores internacionais, valide previamente se a conta de produção possui essa permissão ativa antes de colocar o fluxo em operação.

***

## Cuidados em ambiente sandbox

As notificações por e-mail e SMS funcionam normalmente em sandbox.

***

> ❗️ Atenção
>
> Evite utilizar dados reais de terceiros durante testes, pois o ambiente pode disparar comunicações reais.

# OpenAPI definition

```json
{
  "openapi": "3.0.1",
  "info": {
    "title": "Asaas",
    "description": "API pública de integração com a plataforma Asaas.",
    "version": "3.0.0"
  },
  "servers": [
    {
      "url": "https://api-sandbox.asaas.com",
      "description": "Sandbox"
    }
  ],
  "security": [
    {
      "Authorization": []
    }
  ],
  "tags": [
    {
      "name": "Clientes"
    }
  ],
  "paths": {
    "/v3/customers": {
      "post": {
        "tags": [
          "Clientes"
        ],
        "summary": "Criar novo cliente",
        "description": "",
        "operationId": "criar-novo-cliente",
        "parameters": [],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CustomerSaveRequestDTO"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Ok",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CustomerGetResponseDTO"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponseDTO"
                },
                "example": {
                  "errors": [
                    {
                      "code": "error_code",
                      "description": "Descrição do erro"
                    }
                  ]
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponseDTO"
                },
                "example": {
                  "errors": [
                    {
                      "code": "invalid_access_token",
                      "description": "A chave de API fornecida é inválida"
                    }
                  ]
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "components": {
    "schemas": {
      "ErrorResponseDTO": {
        "type": "object",
        "properties": {
          "errors": {
            "type": "array",
            "description": "Lista de objetos",
            "deprecated": false,
            "items": {
              "$ref": "#/components/schemas/ErrorResponseItemDTO"
            }
          }
        }
      },
      "ErrorResponseItemDTO": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "description": "Código do erro",
            "deprecated": false,
            "example": null
          },
          "description": {
            "type": "string",
            "description": "Descrição do erro",
            "deprecated": false,
            "example": null
          }
        },
        "description": "Lista de objetos",
        "deprecated": false
      },
      "CustomerGetResponseDTO": {
        "type": "object",
        "properties": {
          "object": {
            "type": "string",
            "description": "Tipo de objeto",
            "example": "customer",
            "deprecated": false
          },
          "id": {
            "type": "string",
            "description": "Identificador único do cliente no Asaas",
            "example": "cus_000005401844",
            "deprecated": false
          },
          "dateCreated": {
            "type": "string",
            "description": "Data de criação do cliente",
            "example": "2024-07-12",
            "deprecated": false
          },
          "name": {
            "type": "string",
            "description": "Nome do cliente",
            "example": "John Doe",
            "deprecated": false
          },
          "email": {
            "type": "string",
            "description": "E-mail do cliente",
            "example": "john.doe@asaas.com.br",
            "deprecated": false
          },
          "phone": {
            "type": "string",
            "description": "Telefone do cliente",
            "example": "90999999999",
            "deprecated": false
          },
          "mobilePhone": {
            "type": "string",
            "description": "Celular do cliente",
            "example": "90999999999",
            "deprecated": false
          },
          "address": {
            "type": "string",
            "description": "Endereço do cliente",
            "example": "Av. Paulista",
            "deprecated": false
          },
          "addressNumber": {
            "type": "string",
            "description": "Número do endereço do cliente",
            "example": "150",
            "deprecated": false
          },
          "complement": {
            "type": "string",
            "description": "Complemento do endereço do cliente",
            "example": "Sala 201",
            "deprecated": false
          },
          "province": {
            "type": "string",
            "description": "Bairro do endereço do cliente",
            "example": "Centro",
            "deprecated": false
          },
          "city": {
            "type": "integer",
            "description": "Identificador único da cidade no Asaas",
            "format": "int32",
            "example": 12565,
            "deprecated": false
          },
          "cityName": {
            "type": "string",
            "description": "Cidade do endereço do cliente",
            "example": "São Paulo",
            "deprecated": false
          },
          "state": {
            "type": "string",
            "description": "Estado do endereço do cliente",
            "example": "SP",
            "deprecated": false
          },
          "country": {
            "type": "string",
            "description": "País do cliente",
            "example": "Brasil",
            "deprecated": false
          },
          "postalCode": {
            "type": "string",
            "description": "CEP do endereço do cliente",
            "example": "01310000",
            "deprecated": false
          },
          "cpfCnpj": {
            "type": "string",
            "description": "CPF ou CNPJ do cliente",
            "example": "24971563792",
            "deprecated": false
          },
          "personType": {
            "$ref": "#/components/schemas/CustomerGetResponsePersonType"
          },
          "deleted": {
            "type": "boolean",
            "description": "Indica se é um cliente deletado",
            "example": false,
            "deprecated": false
          },
          "additionalEmails": {
            "type": "string",
            "description": "E-mails adicionais do cliente",
            "example": "john.doe@asaas.com,john.doe.silva@asaas.com.br",
            "deprecated": false
          },
          "externalReference": {
            "type": "string",
            "description": "Referência externa do cliente",
            "example": "12987382",
            "deprecated": false
          },
          "notificationDisabled": {
            "type": "boolean",
            "description": "Indica se as notificações estão desabilitadas",
            "example": false,
            "deprecated": false
          },
          "observations": {
            "type": "string",
            "description": "Observações do cliente",
            "example": "ótimo pagador, nenhum problema até o momento",
            "deprecated": false
          },
          "foreignCustomer": {
            "type": "boolean",
            "description": "indica se o pagador é estrangeiro",
            "example": false,
            "deprecated": false
          }
        }
      },
      "CustomerGetResponsePersonType": {
        "type": "string",
        "description": "Tipo de pessoa",
        "example": "FISICA",
        "deprecated": false,
        "enum": [
          "JURIDICA",
          "FISICA"
        ]
      },
      "CustomerSaveRequestDTO": {
        "required": [
          "name",
          "cpfCnpj"
        ],
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Nome do cliente",
            "nullable": false,
            "example": "John Doe",
            "deprecated": false
          },
          "cpfCnpj": {
            "type": "string",
            "description": "CPF ou CNPJ do cliente",
            "nullable": false,
            "example": "24971563792",
            "deprecated": false
          },
          "email": {
            "type": "string",
            "description": "Email do cliente",
            "example": "john.doe@asaas.com.br",
            "deprecated": false
          },
          "phone": {
            "type": "string",
            "description": "Fone fixo",
            "example": "4738010919",
            "deprecated": false
          },
          "mobilePhone": {
            "type": "string",
            "description": "Fone celular",
            "example": "4799376637",
            "deprecated": false
          },
          "address": {
            "type": "string",
            "description": "Logradouro",
            "example": "Av. Paulista",
            "deprecated": false
          },
          "addressNumber": {
            "type": "string",
            "description": "Número do endereço",
            "example": "150",
            "deprecated": false
          },
          "complement": {
            "type": "string",
            "description": "Complemento do endereço (máx. 255 caracteres)",
            "example": "Sala 201",
            "deprecated": false
          },
          "province": {
            "type": "string",
            "description": "Bairro",
            "example": "Centro",
            "deprecated": false
          },
          "postalCode": {
            "type": "string",
            "description": "CEP do endereço",
            "example": "01310-000",
            "deprecated": false
          },
          "externalReference": {
            "type": "string",
            "description": "Identificador do cliente no seu sistema",
            "example": "12987382",
            "deprecated": false
          },
          "notificationDisabled": {
            "type": "boolean",
            "description": "true para desabilitar o envio de notificações de cobrança",
            "example": false,
            "deprecated": false
          },
          "additionalEmails": {
            "type": "string",
            "description": "Emails adicionais para envio de notificações de cobrança separados por \",\"",
            "example": "john.doe@asaas.com,john.doe.silva@asaas.com.br",
            "deprecated": false
          },
          "municipalInscription": {
            "type": "string",
            "description": "Inscrição municipal do cliente",
            "example": "46683695908",
            "deprecated": false
          },
          "stateInscription": {
            "type": "string",
            "description": "Inscrição estadual do cliente",
            "example": "646681195275",
            "deprecated": false
          },
          "observations": {
            "type": "string",
            "description": "Observações adicionais",
            "example": "ótimo pagador, nenhum problema até o momento",
            "deprecated": false
          },
          "groupName": {
            "type": "string",
            "description": "Nome do grupo ao qual o cliente pertence",
            "deprecated": false,
            "example": null
          },
          "company": {
            "type": "string",
            "description": "Empresa",
            "deprecated": false,
            "example": null
          },
          "foreignCustomer": {
            "type": "boolean",
            "description": "informe true caso seja pagador estrangeiro",
            "example": false,
            "deprecated": false
          }
        }
      }
    },
    "securitySchemes": {
      "Authorization": {
        "type": "apiKey",
        "name": "access_token",
        "in": "header"
      }
    }
  }
}
```