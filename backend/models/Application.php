<?php
class Application {
    private $conn;
    private $table_name = "applications";

    public $id;
    public $user_id;
    public $course_name;
    public $start_date;
    public $payment_method;
    public $status;
    public $created_at;
    public $feedback;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                SET user_id=:user_id, course_name=:course_name, start_date=:start_date, 
                    payment_method=:payment_method, status='Новая'";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":course_name", $this->course_name);
        $stmt->bindParam(":start_date", $this->start_date);
        $stmt->bindParam(":payment_method", $this->payment_method);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function readByUser($user_id) {
        $query = "SELECT * FROM " . $this->table_name . " 
                WHERE user_id = ? 
                ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);
        $stmt->execute();

        return $stmt;
    }

    public function readAll() {
        $query = "SELECT a.*, u.full_name, u.email, u.phone 
                FROM " . $this->table_name . " a
                LEFT JOIN users u ON a.user_id = u.id
                ORDER BY a.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    public function updateStatus() {
        $query = "UPDATE " . $this->table_name . " 
                SET status = :status
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function updateFeedback() {
        $query = "UPDATE " . $this->table_name . " 
                SET feedback = :feedback
                WHERE id = :id AND user_id = :user_id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":feedback", $this->feedback);
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>