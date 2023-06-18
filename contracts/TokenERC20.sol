// SPDX-License-Identifier: GPL-3.0
/*-----------------------------------------------------------
 @Filename:         TokenERC20.sol
 @Copyright Author: Yogesh K
 @Date:             11/11/2022
-------------------------------------------------------------*/
pragma solidity ^0.8.12;
import "hardhat/console.sol";

contract TokenERC20 {
    string public name;
    string public symbol;
    uint256 public decimals = 18;
    uint256 public totalSupply;
    // track balances
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * (10**decimals); // 1000000 * 10^18;
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value)
        public
        returns (bool success)
    {
        // sender must have enough tokens to spend
        require(balanceOf[msg.sender] >= _value, "not enough tokens");
        _transfer(msg.sender, _to, _value);
        return true;
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _value
    ) internal {
        require(_to != address(0));
        balanceOf[_from] = balanceOf[_from] - _value;
        balanceOf[_to] += _value;
        emit Transfer(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value)
        public
        returns (bool success)
    {
        require(_spender != address(0));
        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        // check approval, msg.sender must have an approval prior to transfer
        require(allowance[_from][msg.sender] >= _value, "not enough allowance");
        require(balanceOf[_from] >= _value, "not enough tokens");
        // spend tokens
        _transfer(_from, _to, _value);
        // Reset allowance
        allowance[_from][msg.sender] -= _value;
        return true;
    }
}
