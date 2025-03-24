<?php
// JSDOS: 贪食蛇游戏后端API
header('Content-Type: application/json');
// 允许跨域请求
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// 处理OPTIONS请求（预检请求）
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 导入数据库配置
require_once 'config.php';

// 获取请求路径和方法
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// 解析API路径
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/api.php', '', $path);
$path_parts = explode('/', trim($path, '/'));

// 获取请求参数
$params = [];
if ($request_method === 'GET') {
    $params = $_GET;
} else {
    $json_body = file_get_contents('php://input');
    if (!empty($json_body)) {
        $params = json_decode($json_body, true) ?: [];
    }
}

// API路由处理
$endpoint = $path_parts[0] ?? '';

switch ($endpoint) {
    case 'login':
        handleLogin($db, $params);
        break;
    case 'members':
        handleMembers($db, $params, $request_method, $path_parts);
        break;
    case 'scores':
        handleScores($db, $params, $request_method, $path_parts);
        break;
    case 'settings':
        handleSettings($db, $params, $request_method);
        break;
    case 'ping':
        echo json_encode(['success' => true, 'message' => 'API服务运行正常']);
        break;
    default:
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => '未找到请求的API端点']);
}

// 处理登录请求
function handleLogin($db, $params) {
    if (empty($params['username']) || empty($params['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => '用户名和密码不能为空']);
        return;
    }
    
    $username = $params['username'];
    $password = $params['password'];
    
    // 允许游客登录
    if (($username === 'guest' || $username === '') && $password === '') {
        $guestId = 'guest_' . rand(1000, 9999);
        echo json_encode([
            'success' => true, 
            'user' => [
                'id' => $guestId,
                'username' => $guestId,
                'role' => 'guest'
            ],
            'isGuest' => true
        ]);
        return;
    }
    
    // 正常用户登录
    $stmt = $db->prepare("SELECT * FROM members WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && $password === $user['password']) { // 生产环境应使用password_verify
        // 不返回密码
        unset($user['password']);
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => '用户名或密码错误']);
    }
}

// 处理会员相关请求
function handleMembers($db, $params, $method, $path_parts) {
    // 检查管理员权限
    if (!empty($path_parts[1]) && $method !== 'GET') {
        $adminRole = $params['adminRole'] ?? '';
        if ($adminRole !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => '没有权限执行此操作']);
            return;
        }
    }
    
    // 获取会员列表
    if ($method === 'GET') {
        $stmt = $db->query("SELECT id, username, role, registerDate FROM members");
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'members' => $members]);
        return;
    }
    
    // 添加新会员
    if ($method === 'POST' && empty($path_parts[1])) {
        $member = $params['member'] ?? [];
        
        if (empty($member['username']) || empty($member['password'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '用户名和密码不能为空']);
            return;
        }
        
        // 检查用户名是否存在
        $stmt = $db->prepare("SELECT COUNT(*) FROM members WHERE username = ?");
        $stmt->execute([$member['username']]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '用户名已存在']);
            return;
        }
        
        // 插入新会员
        $stmt = $db->prepare("INSERT INTO members (id, username, password, role, registerDate) VALUES (?, ?, ?, ?, ?)");
        $id = uniqid();
        $role = $member['role'] ?? 'user';
        $registerDate = date('Y-m-d H:i:s');
        
        if ($stmt->execute([$id, $member['username'], $member['password'], $role, $registerDate])) {
            echo json_encode(['success' => true, 'message' => '会员添加成功']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '添加会员失败']);
        }
        return;
    }
    
    // 更新会员
    if ($method === 'PUT' && !empty($path_parts[1])) {
        $memberId = $path_parts[1];
        
        // 不允许修改admin账户
        if ($memberId === 'admin') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '不能修改主管理员账户']);
            return;
        }
        
        $member = $params;
        $updateFields = [];
        $updateValues = [];
        
        if (!empty($member['username'])) {
            $updateFields[] = "username = ?";
            $updateValues[] = $member['username'];
        }
        
        if (!empty($member['password'])) {
            $updateFields[] = "password = ?";
            $updateValues[] = $member['password'];
        }
        
        if (!empty($member['role'])) {
            $updateFields[] = "role = ?";
            $updateValues[] = $member['role'];
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '没有提供要更新的字段']);
            return;
        }
        
        $updateValues[] = $memberId;
        $sql = "UPDATE members SET " . implode(", ", $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        
        if ($stmt->execute($updateValues)) {
            echo json_encode(['success' => true, 'message' => '会员更新成功']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '更新会员失败']);
        }
        return;
    }
    
    // 删除会员
    if ($method === 'DELETE' && !empty($path_parts[1])) {
        $memberId = $path_parts[1];
        
        // 不允许删除admin账户
        if ($memberId === 'admin') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '不能删除主管理员账户']);
            return;
        }
        
        $stmt = $db->prepare("DELETE FROM members WHERE id = ?");
        if ($stmt->execute([$memberId])) {
            echo json_encode(['success' => true, 'message' => '会员删除成功']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '删除会员失败']);
        }
        return;
    }
    
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => '不支持的请求方法']);
}

// 处理分数相关请求
function handleScores($db, $params, $method, $path_parts) {
    // 获取个人分数
    if ($method === 'GET' && !empty($path_parts[1]) && $path_parts[1] === 'user' && !empty($path_parts[2])) {
        $username = $path_parts[2];
        $stmt = $db->prepare("SELECT * FROM scores WHERE username = ? ORDER BY score DESC");
        $stmt->execute([$username]);
        $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'scores' => $scores]);
        return;
    }
    
    // 获取全球排行榜
    if ($method === 'GET' && empty($path_parts[1])) {
        // 获取设置中的最大排行榜记录数
        $stmt = $db->query("SELECT value FROM settings WHERE name = 'maxScores'");
        $maxScores = $stmt->fetchColumn() ?: 10;
        
        $stmt = $db->prepare("SELECT * FROM scores ORDER BY score DESC LIMIT ?");
        $stmt->bindValue(1, (int)$maxScores, PDO::PARAM_INT);
        $stmt->execute();
        $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'scores' => $scores]);
        return;
    }
    
    // 保存新分数
    if ($method === 'POST' && empty($path_parts[1])) {
        if (empty($params['username']) || !isset($params['score'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '用户名和分数不能为空']);
            return;
        }
        
        $username = $params['username'];
        $score = (int)$params['score'];
        $id = uniqid();
        $date = date('Y-m-d H:i:s');
        
        $stmt = $db->prepare("INSERT INTO scores (id, username, score, date) VALUES (?, ?, ?, ?)");
        if ($stmt->execute([$id, $username, $score, $date])) {
            // 获取更新后的排行榜
            $maxScores = 10;
            $settingsStmt = $db->query("SELECT value FROM settings WHERE name = 'maxScores'");
            if ($result = $settingsStmt->fetch(PDO::FETCH_ASSOC)) {
                $maxScores = (int)$result['value'];
            }
            
            $topStmt = $db->prepare("SELECT * FROM scores ORDER BY score DESC LIMIT ?");
            $topStmt->bindValue(1, $maxScores, PDO::PARAM_INT);
            $topStmt->execute();
            $topScores = $topStmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true, 
                'message' => '分数保存成功',
                'newScore' => [
                    'id' => $id,
                    'username' => $username,
                    'score' => $score,
                    'date' => $date
                ],
                'topScores' => $topScores
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '保存分数失败']);
        }
        return;
    }
    
    // 删除分数
    if ($method === 'DELETE' && !empty($path_parts[1])) {
        $scoreId = $path_parts[1];
        $username = $_GET['username'] ?? '';
        
        // 验证权限（只有分数所有者或管理员可以删除）
        $stmt = $db->prepare("SELECT username FROM scores WHERE id = ?");
        $stmt->execute([$scoreId]);
        $score = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$score) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => '找不到指定的分数记录']);
            return;
        }
        
        // 检查是否是管理员
        $isAdmin = false;
        if (!empty($username)) {
            $adminStmt = $db->prepare("SELECT role FROM members WHERE username = ?");
            $adminStmt->execute([$username]);
            $user = $adminStmt->fetch(PDO::FETCH_ASSOC);
            $isAdmin = ($user && $user['role'] === 'admin');
        }
        
        if ($score['username'] !== $username && !$isAdmin) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => '没有权限删除此记录']);
            return;
        }
        
        $stmt = $db->prepare("DELETE FROM scores WHERE id = ?");
        if ($stmt->execute([$scoreId])) {
            echo json_encode(['success' => true, 'message' => '分数记录删除成功']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '删除分数记录失败']);
        }
        return;
    }
    
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => '不支持的请求方法']);
}

// 处理设置相关请求
function handleSettings($db, $params, $method) {
    // 获取设置
    if ($method === 'GET') {
        $stmt = $db->query("SELECT name, value FROM settings");
        $settingsRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $settings = [];
        foreach ($settingsRows as $row) {
            $settings[$row['name']] = $row['value'];
        }
        
        echo json_encode(['success' => true, 'settings' => $settings]);
        return;
    }
    
    // 更新设置
    if ($method === 'POST') {
        $adminRole = $params['role'] ?? '';
        if ($adminRole !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => '没有权限执行此操作']);
            return;
        }
        
        $settings = $params['settings'] ?? [];
        if (empty($settings)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '没有提供要更新的设置']);
            return;
        }
        
        $success = true;
        foreach ($settings as $name => $value) {
            // 检查设置是否存在
            $checkStmt = $db->prepare("SELECT COUNT(*) FROM settings WHERE name = ?");
            $checkStmt->execute([$name]);
            $exists = $checkStmt->fetchColumn() > 0;
            
            if ($exists) {
                $stmt = $db->prepare("UPDATE settings SET value = ? WHERE name = ?");
                $result = $stmt->execute([$value, $name]);
            } else {
                $stmt = $db->prepare("INSERT INTO settings (name, value) VALUES (?, ?)");
                $result = $stmt->execute([$name, $value]);
            }
            
            if (!$result) {
                $success = false;
            }
        }
        
        if ($success) {
            echo json_encode(['success' => true, 'message' => '设置更新成功']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '更新设置失败']);
        }
        return;
    }
    
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => '不支持的请求方法']);
}
?> 