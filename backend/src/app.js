'use strict';
const path = require('path');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const send = require('koa-send');
const serve = require('koa-static');
const logger = require('koa-logger');
const config = require('./services/config');
const readDir = require('recursive-readdir-sync');
const db = require('./services/db');

db.connect();
const controllersDir = path.join(__dirname, 'controllers');

const app = new Koa();
app.keys = config.keys;

if (process.env.ENV !== 'production') {
    app.use(logger());
}

app
    .use(serve(path.join(__dirname, '..', '..', 'dist')))
    .use(bodyParser());

const files = readDir(controllersDir)
    .filter(file => file.endsWith('.js'));

files.forEach(file => {
    // eslint-disable-next-line
    const controller = require(file);
    if (!controller.routes) {
        return;
    }
    app.use(controller.routes())
        .use(controller.allowedMethods());
});

app
    .use(async (ctx, next) => {
        if (ctx.method !== 'GET') {
            return next()
        }

        if (ctx.accepts('json', 'html') === 'json') {
            return next();
        }

        await send(ctx, 'index.html', {
            root: './dist',
        });
    })
    .use(async ctx => {
        ctx.status = 404;
    });


app.listen(config.app.port, () => console.log(`app spins on ${config.app.port}`));
