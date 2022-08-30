// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    // For each token address we see how many tokens belong to each user address
    mapping(address => mapping(address => uint256)) public tokens;
    // Orders
    mapping(uint256 => _Order) public orders;
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

    // Order model
    struct _Order {
        uint256 id; // Unique identifier
        address user; // User/maker
        address tokenGet; // Address of token received
        uint256 amountGet; // Amount of tokens received
        address tokenGive; // Address of token given
        uint256 amountGive; // Amount of tokens given
        uint256 timestamp; // Time of order creation
    }

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // -----------------------------------------
    // DEPOSIT AND WITHDRAW TOKENS

    function depositToken(address _token, uint256 _amount) public {
        // Call token contract
        // Transfer tokens to the exchange
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));

        // Update user balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;

        // Emit an Event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) public {
        // Require user to have enough tokens to withdraw
        require(tokens[_token][msg.sender] >= _amount);
        // Transfer tokens to user
        Token(_token).transfer(msg.sender, _amount);

        // Update user balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;

        // Emit an Event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    // Check tokens mapping balances with wrapper function
    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    // ---------------------------------------------
    // MAKE AND CANCEL ORDERS

    // Token Give = which token and how much to spend?
    // Token Get = which token and how much to receive?
    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        // Tokens must be on the exchange
        require(balanceOf(_tokenGive, msg.sender) >= _amountGive);
        // Increment the order ID
        orderCount = orderCount + 1;
        // Instantiate the order
        orders[orderCount] = _Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );

        // Emit event
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
}
