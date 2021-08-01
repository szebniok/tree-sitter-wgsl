(const_literal) @number

(type_declaration) @type

(function_declaration
    (identifier) @function)

(type_constructor_or_function_call_expression
    (type_declaration) @function)

[
    "struct"
    "bitcast"
    ; "block"
    "discard"
    "enable"
    "fallthrough"
    "fn"
    "let"
    "private"
    "read"
    "read_write"
    "return"
    "storage"
    "type"
    "uniform"
    "var"
    "workgroup"
    "write"
] @keyword ; TODO reserved keywords

[
    (true)
    (false)
] @constant.builtin

;; punctuation
[ "," "." ":" ";" ] @punctuation.delimeter

;; brackets
[
    "("
    ")"
    "["
    "]"
    "{"
    "}"
] @punctuation.bracket

[
    "loop"
    "for"
    "break"
    "continue"
    "continuing"
] @repeat

[
    "if"
    "else"
    "elseif"
    "switch"
    "case"
    "default"
] @conditional

[
    "&"
    "&&"
    "/"
    "!"
    "="
    "=="
    "!="
    ">"
    ">="
    ">>"
    "<"
    "<="
    "<<"
    "%"
    "-"
    "+"
    "|"
    "||"
    "*"
    "~"
    "^"
] @operator

(attribute
    (identifier) @property)

(comment) @comment

(ERROR) @error