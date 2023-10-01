'use strict'
const {
  Model
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate (models) {
      User.hasOne(models.Class, { foreignKey: 'teacherId' })
      User.hasMany(models.Enrollment, { foreignKey: 'studentId '})
    }
  };
  User.init({
    name: DataTypes.STRING,
    account: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    avatar: { type: DataTypes.STRING, defaultValue: 'https://images.unsplash.com/photo-1525498128493-380d1990a112?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1335&q=80' },
    aboutMe: DataTypes.STRING,
    nation: DataTypes.STRING,
    role: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    // underscored: true
  });
  return User;
};