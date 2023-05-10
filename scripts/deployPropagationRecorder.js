/*
 * @Author: daibi dbfornewsletter@outlook.com
 * @Date: 2023-05-10 01:11:26
 * @LastEditors: daibi dbfornewsletter@outlook.com
 * @LastEditTime: 2023-05-10 01:38:25
 * @FilePath: /RMRK-demo/scripts/deployPropagationRecorder.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/* global ethers */
/* eslint prefer-const: "off" */

const { ethers } = require('hardhat')

async function deployPropagationRecorder() {
    
    const accounts = await ethers.getSigners()

    const PropagationRecorder = await ethers.getContractFactory('PropagationRecorder')
    const propagationRecorder = await PropagationRecorder.deploy([15])

    await propagationRecorder.deployed()

    console.log(`propagationRecorder deployed: ${propagationRecorder.address}`)

    return propagationRecorder.address

}

if (require.main === module) {
    deployPropagationRecorder()
        .then((address) => {return address})
        .catch(error => {
            console.error(error)
            process.exit(1)
    })
}

exports.deployPropagationRecorder = deployPropagationRecorder
