<?php
class SupportTicket {
    private $conn;
    private $table_name = "support_tickets";

    public $id;
    public $user_id;
    public $subject;
    public $message;
    public $status;
    public $admin_response;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                SET user_id=:user_id, subject=:subject, message=:message, status='Открыт'";

        $stmt = $this->conn->prepare($query);

        $this->subject = htmlspecialchars(strip_tags($this->subject));
        $this->message = htmlspecialchars(strip_tags($this->message));

        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":subject", $this->subject);
        $stmt->bindParam(":message", $this->message);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function readByUser($user_id) {
        $query = "SELECT * FROM " . $this->table_name . " 
                WHERE user_id = :user_id 
                ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();

        return $stmt;
    }

    public function readAll() {
        $query = "SELECT st.*, u.full_name, u.email 
                FROM " . $this->table_name . " st
                LEFT JOIN users u ON st.user_id = u.id
                ORDER BY st.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    public function readOne($id) {
        $query = "SELECT st.*, u.full_name, u.email 
                FROM " . $this->table_name . " st
                LEFT JOIN users u ON st.user_id = u.id
                WHERE st.id = ? 
                LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->user_id = $row['user_id'];
            $this->subject = $row['subject'];
            $this->message = $row['message'];
            $this->status = $row['status'];
            $this->admin_response = $row['admin_response'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            return true;
        }
        return false;
    }

    public function updateStatus() {
        $query = "UPDATE " . $this->table_name . " 
                SET status=:status
                WHERE id=:id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function addResponse() {
        $query = "UPDATE " . $this->table_name . " 
                SET admin_response=:admin_response, status=:status
                WHERE id=:id";

        $stmt = $this->conn->prepare($query);

        $this->admin_response = htmlspecialchars(strip_tags($this->admin_response));

        $stmt->bindParam(":admin_response", $this->admin_response);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);

        if ($stmt->execute()) {
            return $stmt->rowCount() > 0;
        }
        return false;
    }
}
?>

