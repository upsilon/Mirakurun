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
/// <reference path="../../../typings/express/express.d.ts" />
'use strict';

import {Operation} from 'express-openapi';
import Channel = require('../Channel');

export var get: Operation = (req, res) => {

    res.json(
        Channel.all().map(channel => {

            const ch: any = channel.export();

            ch.services = channel.getServices().map(service => ({
                id: service.id,
                name: service.name
            }));

            return ch;
        })
    );
};

get.apiDoc = {
    tags: ['channels'],
    operationId: 'getChannels',
    responses: {
        200: {
            description: 'OK',
            schema: {
                type: 'array',
                items: {
                    $ref: '#/definitions/Channel'
                }
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