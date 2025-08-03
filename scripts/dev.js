//这个文件会帮我们打包packages下的模块，最终打包出js文件

//node dev.js (要打包的名字 -f 打包的格式) === argv

import minimist from "minimist";
import {resolve,dirname} from "path";
import { fileURLToPath } from "url";
// node 没有require，兼容下require写法，csj
import { createRequire } from "module";
import esbuild from "esbuild"

//node中的命令参数通过process来获取process.argv
const args = minimist(process.argv.slice(2))

const __filename  =  fileURLToPath(import.meta.url) //获取文件绝对路径 file" -> /usr
const __dirname = dirname(__filename)
const target = args._[0] || "reacitvity" //打包哪个项目
const format = args.f || "iif" //打包后的模块规范化

//入口文件 根据命令行提供的路径来进行解析
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)
const pkg = resolve(`../packages/${target}/package.json`)
esbuild.context({
    entryPoints: [entry],
    outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`), //出口
    bundle: true, //reactivity ->shared 会打包到一起
    platform: "browser",
    sourcemap: true,
    format,
    globalName: pkg.buildOptions?.name

}).then((cxt)=>{
    console.log(cxt);
    return cxt.watch()
})