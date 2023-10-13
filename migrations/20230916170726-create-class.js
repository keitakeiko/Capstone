'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Classes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      teacherId: {
        type: Sequelize.INTEGER
      },
      className: {
        type: Sequelize.STRING
      },
      spendTime: {
        type: Sequelize.INTEGER
      },
      teachingStyle: {
        type: Sequelize.TEXT
      },
      availableTime: {
        type: Sequelize.DATE
      },
      classDetail: {
        type: Sequelize.TEXT
      },
      classUrl: {
        type: Sequelize.STRING
      },
      introduction: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Classes');
  }
};