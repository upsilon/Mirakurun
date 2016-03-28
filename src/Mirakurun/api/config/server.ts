/*
   Copyright 2016 Yuki KAN

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
/// <reference path="../../../../typings/express/express.d.ts" />
'use strict';

import {Operation} from 'express-openapi';
import config = require('../../config');

export var get: Operation = (req, res) => {

    res.status(200);
    res.json(config.loadServer());
};

get.apiDoc = {
    tags: ['config'],
    operationId: 'getServerConfig',
    responses: {
        200: {
            description: 'OK',
            schema: {
                $ref: '#/definitions/ConfigServer'
            }
        },
        default: {
            description: 'Unexpected Error',
            schema: {
                $ref: '#/definitions/Error'
            }
        }
    }
};

export var put: Operation = (req, res) => {

    const server: config.Server = req.body;

    config.saveServer(server);

    res.status(200);
    res.json(server);
};

put.apiDoc = {
    tags: ['config'],
    operationId: 'updateServerConfig',
    parameters: [
        {
            in: 'body',
            name: 'body',
            schema: {
                $ref: '#/definitions/ConfigServer'
            }
        }
    ],
    responses: {
        200: {
            description: 'OK',
            schema: {
                $ref: '#/definitions/ConfigServer'
            }
        },
        default: {
            description: 'Unexpected Error',
            schema: {
                $ref: '#/definitions/Error'
            }
        }
    }
};