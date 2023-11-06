'use strict';
module.exports = {
  up: async  (queryInterface, Sequelize) => {
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
      spendTime: {
        type: Sequelize.INTEGER
      },
      teachingStyle: {
        type: Sequelize.TEXT
      },
      availableTime: {
        type: Sequelize.STRING
      },
      availableDay: {
        type: Sequelize.STRING
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
  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Classes');
  }
};