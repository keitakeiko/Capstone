'use strict'
const {
  Model
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Enrollment extends Model {
    
    static associate (models) {
      Enrollment.belongsTo(models.User, { foreignKey: 'studentId' })
      Enrollment.belongsTo(models.Class, { foreignKey: 'classId' })
    }
  }
  Enrollment.init({
    studentId: DataTypes.INTEGER,
    classId: DataTypes.INTEGER,
    score: DataTypes.FLOAT,
    spendTime: DataTypes.INTEGER,
    classTime: DataTypes.DATE,
    studentComment: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Enrollment',
    tableName: 'Enrollments',
    // underscored: true,
  });
  return Enrollment;
};