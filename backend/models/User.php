<?php
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $login;
    public $password;
    public $full_name;
    public $phone;
    public $email;
    public $avatar;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                SET login=:login, password=:password, full_name=:full_name, 
                    phone=:phone, email=:email";

        $stmt = $this->conn->prepare($query);

        $this->login = htmlspecialchars(strip_tags($this->login));
        $this->password = htmlspecialchars(strip_tags($this->password));
        $this->full_name = htmlspecialchars(strip_tags($this->full_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->email = htmlspecialchars(strip_tags($this->email));

        $stmt->bindParam(":login", $this->login);
        $stmt->bindParam(":password", $this->password);
        $stmt->bindParam(":full_name", $this->full_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":email", $this->email);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function loginExists() {
        $query = "SELECT id, password, full_name 
                FROM " . $this->table_name . " 
                WHERE login = ? 
                LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->login);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->password = $row['password'];
            $this->full_name = $row['full_name'];
            return true;
        }
        return false;
    }

    public function loginExistsWithPassword() {
        $query = "SELECT id, full_name, avatar 
                FROM " . $this->table_name . " 
                WHERE login = ? AND password = ? 
                LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->login);
        $stmt->bindParam(2, $this->password);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->full_name = $row['full_name'];
            $this->avatar = $row['avatar'];
            return true;
        }
        return false;
    }

    public function readOne($id) {
        $query = "SELECT id, login, full_name, phone, email, avatar 
                FROM " . $this->table_name . " 
                WHERE id = ? 
                LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->login = $row['login'];
            $this->full_name = $row['full_name'];
            $this->phone = $row['phone'];
            $this->email = $row['email'];
            $this->avatar = $row['avatar'];
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                SET full_name=:full_name, phone=:phone, email=:email, avatar=:avatar
                WHERE id=:id";

        $stmt = $this->conn->prepare($query);

        $this->full_name = htmlspecialchars(strip_tags($this->full_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->email = htmlspecialchars(strip_tags($this->email));
        if ($this->avatar) {
            $this->avatar = htmlspecialchars(strip_tags($this->avatar));
        }

        $stmt->bindParam(":full_name", $this->full_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":avatar", $this->avatar);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function updatePassword() {
        $query = "UPDATE " . $this->table_name . " 
                SET password=:password
                WHERE id=:id";

        $stmt = $this->conn->prepare($query);

        $this->password = htmlspecialchars(strip_tags($this->password));

        $stmt->bindParam(":password", $this->password);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>