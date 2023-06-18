// SPDX-License-Identifier: GPL-3.0
/*-----------------------------------------------------------
 @Filename:         OrderBookExchange.sol
 @Copyright Author: Yogesh K
 @Date:             11/11/2022
-------------------------------------------------------------*/
pragma solidity ^0.8.12;
import "hardhat/console.sol";
import "./TokenERC20.sol";

contract OrderBookExchange {
    address public feeAccount;
    uint256 public feePercent;
    // token addr => user addr => amount
    mapping(address => mapping(address => uint256)) public usertokens;
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public orderCancelled; // true or false
    mapping(uint256 => bool) public orderCompleted; // true or false

    //Order structure
    struct _Order {
        uint256 id; //unique order id
        address user; // Address who made the order
        address tokenGet; // Address of token to receive
        uint256 amountGet; // Amount to receive
        address tokenGive; // Address of token to give
        uint256 amountGive; // Amount to Give
        uint256 timestamp; // Order time creation
    }
    uint256 public orderCount;
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(
        address token,
        address user,
        uint256 amount,
        uint256 balance
    );
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Cancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Trade(
        uint256 id,
        address user, // user who executes an order
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address creator, // user who creates an order
        uint256 timestamp
    );

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // Deposit tokens
    function depositToken(address _token, uint256 _amount) public {
        // Transfer tokens to exchange
        require(
            TokenERC20(_token).transferFrom(msg.sender, address(this), _amount),
            "transfer failed"
        );
        // Update user balance
        usertokens[_token][msg.sender] += _amount;
        // Emit event
        emit Deposit(
            _token,
            msg.sender,
            _amount,
            usertokens[_token][msg.sender]
        );
    }

    // Withdraw tokens
    function withdrawToken(address _token, uint256 _amount) public {
        // ensure user has enough tokens to wihdraw
        require(
            usertokens[_token][msg.sender] >= _amount,
            "not enough tokens to withdraw"
        );
        // Transfer tokens to user
        TokenERC20(_token).transfer(msg.sender, _amount);
        // Update user balance
        usertokens[_token][msg.sender] -= _amount;

        // Emit event
        emit Withdraw(
            _token,
            msg.sender,
            _amount,
            usertokens[_token][msg.sender]
        );
    }

    // Check balances
    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return usertokens[_token][_user];
    }

    // Make Order: token to exchange.
    // Token to give: which token and how much
    // Token to get or receive: which token and how much
    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        require(
            balanceOf(_tokenGive, msg.sender) >= _amountGive,
            "Insufficient Give token Balance"
        );
        orderCount += 1;
        // Create a new order
        orders[orderCount] = _Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
        emit Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
    }

    // Cancel Order :Pass the id to cancel
    function cancelOrder(uint256 _id) public {
        // Fetch order
        _Order storage order = orders[_id];

        // Order must exist and must be a valid user
        require(order.id == _id, "Order does not exist");
        require(order.user == msg.sender, "Invalid user");
        // Cancel order
        orderCancelled[_id] = true;

        // emit event
        emit Cancel(
            order.id,
            msg.sender,
            order.tokenGet,
            order.amountGet,
            order.tokenGive,
            order.amountGive,
            block.timestamp
        );
    }

    // Execute Orders
    function executeOrder(uint256 _id) public {
        // Fetch order
        _Order storage order = orders[_id];

        // To execute:
        // 1. id must be valid
        // 2. order cant be already completed
        // 3. order cant be already cancelled
        require(_id > 0 && _id <= orderCount, "Invalid order ID");
        require(!orderCancelled[_id], "order already cancelled");
        require(!orderCompleted[_id], "order already completed");

        // Swap or trade tokens
        _trade(
            order.id,
            order.user,
            order.tokenGet, // say e.g. fDAI
            order.amountGet,
            order.tokenGive, // say e.g.  KN
            order.amountGive
        );
        orderCompleted[order.id] = true;
    }

    function _trade(
        uint256 _orderid,
        address _user,
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) internal {
        // do trade here

        // fee is paid by the user who executes the order
        // fee is deducted from _amountGet
        uint256 _feeAmount = (_amountGet * feePercent) / 100;
        // decrement for person who fulfills order
        usertokens[_tokenGet][msg.sender] -= _amountGet + _feeAmount;
        // increment for person who requested order
        usertokens[_tokenGet][_user] += _amountGet;

        // Charge fees
        usertokens[_tokenGet][feeAccount] += _feeAmount;

        // decrement for person who requested order
        usertokens[_tokenGive][_user] -= _amountGive;
        // increment for person who fulfills order
        usertokens[_tokenGive][msg.sender] += _amountGive;

        emit Trade(
            _orderid,
            msg.sender, // user who executes an order
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            _user, // user who creates an order
            block.timestamp
        );
    }
}
