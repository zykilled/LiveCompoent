const formidable = require("formidable");
const logger = require('../log/Log');
class HttpApp {

    constructor() {
        this.map = new Map();
        this.handlerData = this.handler.bind(this);
    }

    register(key, func){
        this.map.set(key, func);
        return this;
    }

    async resolve(ctx, next){
        const form = new formidable.IncomingForm();
        await form.parse(ctx.req,async function(err,fields,files){
            if(err){
                ctx.body = err.message;
            }else {
                ctx.request.body = fields;
            }

        });
        await next();
    }

    async handler(ctx){
        const func = this.map.get(ctx.path);
        if (func){
            await func(ctx.request.body, ctx);
        }else {
            logger.info(ctx.path);
            ctx.response.status = 404;
            ctx.response.body = {
                message: '未找到该接口',
                url: ctx.path
            };
        }
    }
}
const httpApp = new HttpApp();
module.exports = httpApp;