<?php
// 数据库连接配置
$host = 'localhost'; // Hostinger数据库主机名
$dbname = 'u123456789_snake'; // 替换为Hostinger数据库名
$username = 'u123456789_snake_user'; // 替换为Hostinger数据库用户名
$password = 'YourPassword123'; // 替换为Hostinger数据库密码

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => '数据库连接失败: ' . $e->getMessage()]);
    exit;
}
?> 