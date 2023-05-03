// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import { NestableWithPricesAndAcceptExpirable } from "./nestable/NestableWithPricesAndAcceptExpirable.sol";

contract ButcheryGoods is NestableWithPricesAndAcceptExpirable {
    
    constructor(address scManagerAddress, InitData memory data)
        NestableWithPricesAndAcceptExpirable(
            scManagerAddress,
            60,
            "https://project-oracle-test.mypinata.cloud/ipfs/bafkreifo3r75hz4ajrb6rr6457m57u6p4275d35k4xitfvkuin34a7zf3q",
            "https://project-oracle-test.mypinata.cloud/ipfs/bafkreiglkl2a6c4wjfgrexrzawwcne4vaex3fgmhz56wrxbtjrfnpskmr4",
            "Bob's Meat",
            "BMT",
            "https://project-oracle-test.mypinata.cloud/ipfs/bafkreiezs4nd6vajbedvo353eajhqspqbwvjhdoimgm4phi5hyud3lqifq",
            "https://project-oracle-test.mypinata.cloud/ipfs/bafkreibgpalkofnmhbz323d5a56s6krog5tagxqckd7fl7b24ayx7slylu",
            data
        )
    {    }

    function contractURI() public view returns (string memory) {
        return this.collectionMetadata();
    }
}