// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IStaderPool {

    function deposit (address receiver) external payable returns (uint256);

    function swapMaticForMaticXViaInstantPool()	external payable;
}