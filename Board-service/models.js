const Sequelize = require('sequelize');
const sequelize = new Sequelize('Board','sangmin','tkdals12', {

    host: '192.168.10.175',
    dialect: 'mysql'
});

const board = sequelize.define('Board', {
    
    article_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id: {
        type: Sequelize.STRING,
        allowNull: false
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    content: {
        type: Sequelize.STRING,
        allowNull: false
    },
    likeit: {
        type: Sequelize.INTEGER
    }
}, {

    timestamps: false, //createdAt, updatedAt column을 생성한다.
    paranoid: false, // deletedAt Column이 table에 추가된다. 해당 row삭제시 삭제된 날짜가 추가되며 이row는 find작업시 제외된다. 즉 data는 삭제되지 않지만, 삭제된 효과를 준다.
    tableName: 'Board'
})

module.exports = {Sequelize, sequelize, board};

    

